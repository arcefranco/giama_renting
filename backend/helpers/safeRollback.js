export async function safeRollback(transaction) {
  try {
    // Si no hay transacción, no hay nada que hacer
    if (!transaction) return;

    // Sequelize marca el estado internamente, pero no lo expone de forma pública.
    // Podemos inspeccionar el campo "finished" que se setea en:
    //   - 'commit' cuando se hace commit
    //   - 'rollback' cuando se hace rollback
    //   - undefined mientras está abierta
    if (transaction.finished === 'commit') {
      // Ya fue commiteada
      return;
    }

    if (transaction.finished === 'rollback') {
      // Ya fue revertida
      return;
    }

    // Si no está terminada, intentamos revertir
    await transaction.rollback();
  } catch (err) {
    // No queremos que un error de rollback opaque el error original,
    // así que lo registramos pero no lo lanzamos.
    console.error('⚠️ Error al hacer rollback seguro:', err.message);
  }
}