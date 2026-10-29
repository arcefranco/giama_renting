#!/usr/bin/env bash
# =============================================================================
# sync_prod_to_testing.sh
#
# Copia los datos de PRODUCCIÓN -> TESTING (una sola dirección).
#
#   prod  giama_renting      -> testing giama_renting_test
#   prod  pa7_giama_renting  -> testing pa7_giama_renting
#
# Qué hace con TESTING:
#   - Las tablas que existen en prod se reemplazan (estructura + datos de prod).
#   - Las tablas que existen SOLO en testing NO se tocan.
#   - No se borra ni se crea ninguna base de datos.
#
# Protecciones contra pisar producción:
#   1. Hosts y server_uuid HARDCODEADOS (no se leen del .env).
#   2. Antes de cada restore se verifica el @@server_uuid del destino:
#      debe ser EXACTAMENTE el de testing y distinto al de prod.
#   3. El dump se genera SIN --databases (no contiene USE / CREATE DATABASE)
#      y se valida que no lo contenga.
#   4. Backup previo de testing.
#   5. Confirmación manual escribiendo una frase.
#
# Uso:
#   bash backend/src/scripts/sync_prod_to_testing.sh
#
# Retomar tras un corte (usa dumps ya bajados, saltea backup y dump):
#   RESUME_DIR=~/giama_dumps/AAAAMMDD_HHMMSS bash backend/src/scripts/sync_prod_to_testing.sh
#
# La contraseña se pide por teclado (o se toma de la variable MYSQL_PWD).
# =============================================================================
set -euo pipefail

# ----------------------------- CONFIG FIJA ----------------------------------
readonly PROD_HOST="rds.giama.com.ar"
readonly PROD_UUID="5456c8d5-4d3e-11f1-b578-068fb6c24227"

readonly TEST_HOST="giama-test-5-7-44.cojfgn4yxtap.us-west-2.rds.amazonaws.com"
readonly TEST_UUID="bfdae4dc-dfe7-11ee-ad02-027000fb1a17"

readonly DB_USER="admin"

# origen_prod:destino_testing
readonly MAPPINGS=(
  "giama_renting:giama_renting_test"
  "pa7_giama_renting:pa7_giama_renting"
)

# Fuera del repo para no commitear datos de producción por error
readonly RESUME_DIR="${RESUME_DIR:-}"
if [[ -n "$RESUME_DIR" ]]; then
  readonly DUMP_DIR="$RESUME_DIR"
else
  readonly DUMP_DIR="${HOME}/giama_dumps/$(date +%Y%m%d_%H%M%S)"
fi
# ----------------------------------------------------------------------------

red()   { printf '\033[1;31m%s\033[0m\n' "$*"; }
green() { printf '\033[1;32m%s\033[0m\n' "$*"; }
info()  { printf '\033[1;36m==> %s\033[0m\n' "$*"; }
die()   { red "ABORTADO: $*"; exit 1; }

# Sanidad de la propia config
[[ "$PROD_HOST" != "$TEST_HOST" ]] || die "PROD_HOST y TEST_HOST son iguales"
[[ "$PROD_UUID" != "$TEST_UUID" ]] || die "PROD_UUID y TEST_UUID son iguales"

command -v mysql     >/dev/null || die "falta el cliente mysql"
command -v mysqldump >/dev/null || die "falta mysqldump"

if [[ -z "${MYSQL_PWD:-}" ]]; then
  read -rsp "Contraseña de ${DB_USER}: " MYSQL_PWD; echo
fi
export MYSQL_PWD

# Flags compatibles con mysqldump 8.x contra servidor 5.7
EXTRA_DUMP_FLAGS=()
if mysqldump --help 2>/dev/null | grep -q -- '--column-statistics'; then
  EXTRA_DUMP_FLAGS+=(--column-statistics=0)
fi
if mysqldump --help 2>/dev/null | grep -q -- '--set-gtid-purged'; then
  EXTRA_DUMP_FLAGS+=(--set-gtid-purged=OFF)
fi

server_uuid() {
  mysql -h "$1" -u "$DB_USER" --connect-timeout=10 -N -B -e "SELECT @@server_uuid"
}

# Verifica que un host sea EXACTAMENTE testing. Se llama justo antes de escribir.
assert_is_testing() {
  local uuid
  uuid="$(server_uuid "$TEST_HOST")" || die "no pude conectar a testing"
  [[ "$uuid" != "$PROD_UUID" ]] || die "¡¡EL DESTINO ES PRODUCCIÓN!! ($uuid)"
  [[ "$uuid" == "$TEST_UUID" ]] || die "uuid de testing inesperado: $uuid"
}

assert_is_prod() {
  local uuid
  uuid="$(server_uuid "$PROD_HOST")" || die "no pude conectar a prod"
  [[ "$uuid" == "$PROD_UUID" ]] || die "uuid de prod inesperado: $uuid"
}

db_exists() { # host db
  [[ "$(mysql -h "$1" -u "$DB_USER" -N -B -e \
    "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='$2'")" == "1" ]]
}

# Lista tablas/vistas con SHOW (evita information_schema, que en testing se cuelga)
list_tables() { # host db
  mysql -h "$1" -u "$DB_USER" -N -B -e "SHOW FULL TABLES FROM \`$2\`" | cut -f1 | sort
}

dump_db() { # host db outfile [tablas...]
  local host="$1" db="$2" out="$3"; shift 3
  mysqldump -h "$host" -u "$DB_USER" \
    --single-transaction --quick --routines --triggers \
    --no-tablespaces --default-character-set=utf8mb4 \
    "${EXTRA_DUMP_FLAGS[@]}" \
    "$db" "$@" \
  | sed -E 's/DEFINER=`[^`]+`@`[^`]+`//g' \
  | gzip > "$out"
}

# --------------------------- 1. VERIFICACIONES -------------------------------
info "Verificando identidad de los servidores"
assert_is_prod
assert_is_testing
green "OK: prod=$PROD_UUID  testing=$TEST_UUID"

for m in "${MAPPINGS[@]}"; do
  src="${m%%:*}"; dst="${m##*:}"
  db_exists "$PROD_HOST" "$src" || die "no existe $src en prod"
  db_exists "$TEST_HOST" "$dst" || die "no existe $dst en testing (no se crean bases)"
done

if [[ -n "$RESUME_DIR" ]]; then
  info "MODO RETOMAR: uso dumps existentes en $DUMP_DIR"
  for m in "${MAPPINGS[@]}"; do
    f="$DUMP_DIR/prod_${m%%:*}.sql.gz"
    [[ -s "$f" ]] || die "falta $f"
    zgrep -q -- '-- Dump completed' "$f" || die "dump incompleto: $f"
  done
else
mkdir -p "$DUMP_DIR"
info "Archivos en: $DUMP_DIR"

# --------------------------- 2. BACKUP TESTING -------------------------------
# Solo las tablas que el restore va a pisar (las que existen también en prod).
# Las tablas exclusivas de testing no se tocan, no hace falta respaldarlas.
for m in "${MAPPINGS[@]}"; do
  src="${m%%:*}"; dst="${m##*:}"
  mapfile -t overlap < <(comm -12 <(list_tables "$PROD_HOST" "$src") <(list_tables "$TEST_HOST" "$dst"))
  info "Backup testing: $dst (${#overlap[@]} tablas que se van a pisar)"
  if (( ${#overlap[@]} > 0 )); then
    dump_db "$TEST_HOST" "$dst" "$DUMP_DIR/backup_testing_${dst}.sql.gz" "${overlap[@]}"
    zgrep -q -- '-- Dump completed' "$DUMP_DIR/backup_testing_${dst}.sql.gz" || die "backup incompleto: $dst"
  fi
done

# --------------------------- 3. DUMP PROD (solo lectura) ---------------------
for m in "${MAPPINGS[@]}"; do
  src="${m%%:*}"
  f="$DUMP_DIR/prod_${src}.sql.gz"
  info "Dump prod: $src"
  dump_db "$PROD_HOST" "$src" "$f"

  # El dump NO debe poder cambiar de base por su cuenta
  if zgrep -qiE '^(USE |CREATE DATABASE|DROP DATABASE)' "$f"; then
    die "el dump $f contiene USE/CREATE/DROP DATABASE"
  fi
  zgrep -q -- '-- Dump completed' "$f" || die "dump incompleto: $f"
  green "OK $(du -h "$f" | cut -f1)"
done
fi

# --------------------------- 4. CONFIRMACIÓN ---------------------------------
echo
red "Se van a SOBRESCRIBIR en TESTING ($TEST_HOST):"
for m in "${MAPPINGS[@]}"; do echo "   prod ${m%%:*}  ->  testing ${m##*:}"; done
echo "Las tablas que existen solo en testing no se tocan."
read -rp "Escribí exactamente 'PISAR TESTING' para continuar: " ok
[[ "$ok" == "PISAR TESTING" ]] || die "cancelado por el usuario"

# --------------------------- 5. RESTORE EN TESTING ---------------------------
for m in "${MAPPINGS[@]}"; do
  src="${m%%:*}"; dst="${m##*:}"
  f="$DUMP_DIR/prod_${src}.sql.gz"

  assert_is_testing   # verificación justo antes de escribir

  info "Restore: prod $src -> testing $dst"
  gunzip < "$f" | mysql -h "$TEST_HOST" -u "$DB_USER" \
    --default-character-set=utf8mb4 "$dst"
  green "OK $dst"
done

echo
green "Listo. Backups de testing en: $DUMP_DIR"
echo "Para volver atrás:  gunzip < $DUMP_DIR/backup_testing_<db>.sql.gz | mysql -h $TEST_HOST -u $DB_USER -p <db>"
