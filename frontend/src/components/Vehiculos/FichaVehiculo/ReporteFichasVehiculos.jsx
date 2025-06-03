import React, {useEffect, useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {getAllCostosPeriodo, getAllAlquileresPeriodo, getAllAmortizaciones} from '../../../reducers/Vehiculos/vehiculosSlice'
import {getConceptosCostos} from '../../../reducers/Costos/costosSlice'
import styles from './FichaVehiculo.module.css'
import { ClipLoader } from 'react-spinners';
import DataGrid, {Column, Scrolling, Export, SearchPanel, 
    FilterRow, HeaderFilter, Paging, Summary, TotalItem} from "devextreme-react/data-grid"
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';

const ReporteFichasVehiculos = () => {
const dispatch = useDispatch()
const [form, setForm] = useState({
    mes: "",
    anio: ""
})
useEffect(() => {
  Promise.all([
    dispatch(getAllAmortizaciones()),
    dispatch(getConceptosCostos()),
    dispatch(getAllAlquileresPeriodo(form)),
    dispatch(getAllCostosPeriodo(form)),
])

},[])

const nombresMeses = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];
const generarPeriodos = () => {
  const hoy = new Date();
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 6); // seis meses adelante
  const inicio = new Date(2025, 0); // enero 2025
  const periodos = [];

  while (fin >= inicio) {
    periodos.push({
      mes: fin.getMonth() + 1,
      anio: fin.getFullYear(),
      nombreMes: nombresMeses[fin.getMonth()]
    });
    fin.setMonth(fin.getMonth() - 1);
  }

  return periodos;
};
const periodos = generarPeriodos();


const { isError, isSuccess, isLoading, message, fichaAllCostos,
fichaAllAlquileres, vehiculos, fichaAllAmortizaciones } = useSelector(state => state.vehiculosReducer);
const {conceptos} = useSelector(state => state.costosReducer)
const { modelos } = useSelector(state => state.generalesReducer);
const [alquileresNormalizados, setAlquileresNormalizados] = useState(null)
const [costosAgrupados, setCostosAgrupados] = useState({});
const [dataGridRows, setDataGridRows] = useState([]);

useEffect(() => {
    Promise.all([
        dispatch(getAllCostosPeriodo(form)),
        dispatch(getAllAlquileresPeriodo(form))
    ])
}, [form["mes"], form["anio"]])

useEffect(() => {
    if (fichaAllAlquileres?.length > 0) {
      const normalizados = fichaAllAlquileres?.flat().map(item => ({
        id: item.id_vehiculo,
        dominio: item.dominio,
        dominio_provisorio: item.dominio_provisorio,
        alquiler: item.importe_neto || 0,
        dias_en_mes: item.dias_en_mes || 0,
      }));
      setAlquileresNormalizados(normalizados);
    }
  }, [fichaAllAlquileres]);

useEffect(() => {
    if (fichaAllCostos?.length > 0) {
      const agrupados = {};
      fichaAllCostos?.flat().forEach(item => {
        const id = item.id_vehiculo;
        const nombre = item.nombre?.toLowerCase().replaceAll(" ", "_");
        const valor = parseFloat(item["SUM(costos_ingresos.importe_neto)"]) || 0;

        if (!agrupados[id]) {
          agrupados[id] = {};
        }

        agrupados[id][nombre] = valor;
      });
      setCostosAgrupados(agrupados);
    }
}, [fichaAllCostos]);

useEffect(() => {
    if (conceptos.length > 0 && (alquileresNormalizados?.length > 0 || Object.keys(costosAgrupados).length > 0)) {
      const conceptosPorNombre = conceptos?.map(c => c.nombre.toLowerCase().replaceAll(" ", "_"));
      const vehiculoIds = new Set([
        ...alquileresNormalizados?.map(a => a.id),
        ...Object.keys(costosAgrupados)?.map(id => parseInt(id)),
      ]);

      const rows = Array.from(vehiculoIds)?.map(id => {
        const alquilerData = alquileresNormalizados?.find(a => a.id === id) || {};
        const costos = costosAgrupados[id] || {};

        const row = {
        vehiculo: vehiculos?.find(v => v.id === id)?.dominio || id, 
        dominio: alquilerData.dominio,
        dominio_provisorio: alquilerData.dominio_provisorio ? alquilerData.dominio_provisorio : "",  
        alquiler: parseFloat(alquilerData.alquiler) || 0,
        dias_en_mes: parseInt(alquilerData.dias_en_mes || 0),
        amortizacion: form["anio"] && form["mes"] ?
         (fichaAllAmortizaciones?.find(e => e.id == id)?.amortizacion) * (-1)
         :
         (fichaAllAmortizaciones?.find(e => e.id == id)?.amortizacion_todos_movimientos) * (-1)
        };

        // Rellenar conceptos con 0 si no están
        conceptosPorNombre.forEach(nombre => {
          row[nombre] = costos[nombre] || 0;
        });

        const totalIngresos = conceptos
          .filter(c => c.ingreso_egreso === "I")
          .reduce((sum, c) => sum + (row[c.nombre?.toLowerCase().replaceAll(" ", "_")] || 0), 0);

        const totalEgresos = conceptos
          .filter(c => c.ingreso_egreso === "E")
          .reduce((sum, c) => sum + (row[c.nombre?.toLowerCase().replaceAll(" ", "_")] || 0), 0);
        row.total = (row.alquiler || 0) + (row.amortizacion) + (totalIngresos + totalEgresos);

        return row;
      });
    const rowsFiltrados = rows.filter(row =>
        row.alquiler !== 0 ||
        conceptos.some(c => row[c.nombre?.toLowerCase().replaceAll(" ", "_")] !== 0)
    );

    setDataGridRows(rowsFiltrados);
    }
}, [alquileresNormalizados, costosAgrupados, conceptos]);

const columnas = [
    { dataField: "dominio", caption: "Vehículo" },
    { dataField: "alquiler", caption: "Alquiler" },
    { dataField: "dias_en_mes", caption: "Días (alquiler)" },
    {dataField: "amortizacion", caption: "Amortización"},
    ...conceptos?.map(c => ({
      dataField: c.nombre?.toLowerCase().replaceAll(" ", "_"),
      caption: c.nombre,
    })),
    { dataField: "total", caption: "Total" },
];

const renderDominio = (data) => {
    console.log("THIS: ", data.data)
    return (
      data.data.dominio ? 
      <button
        onClick={() =>{
            if(!form["anio"] && !form["mes"]){
                window.open(`/vehiculos/ficha/${data.data.vehiculo}`, '_blank')
            }else{
                window.open(`/vehiculos/ficha/${data.data.vehiculo}/${form["anio"]}/${form["mes"]}`, '_blank')
            }  
        }
        } 
        style={{ color: '#1976d2', fontSize: "11px", textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        {data.data.dominio}
      </button>
      :
      data.data.dominio_provisorio ?
      <button
        onClick={() =>{
            if(!form["anio"] && !form["mes"]){
                window.open(`/vehiculos/ficha/${data.data.vehiculo}`, '_blank')
            }else{
                window.open(`/vehiculos/ficha/${data.data.vehiculo}/${form["anio"]}/${form["mes"]}`, '_blank')
            }  
        }
        } 
        style={{ color: '#1976d2', fontSize: "11px", textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        {data.data.dominio_provisorio}
      </button>
      :
      <span>SIN DOMINIO</span>
    );
};
  return (
    <div>
    {isLoading && (
    <div className={styles.spinnerOverlay}>
    <ClipLoader
      size={60}
      color="#800020" // bordó
      loading={true}
    />
      <span className={styles.loadingText}>Cargando vehículos...</span>
    </div>
  )}    
        <h2>Reporte fichas de vehículos</h2>
    <div className={styles.select}>
        <span>Período: </span>
      <select
        value={form.mes && form.anio ? `${form.mes}-${form.anio}` : ""}
        onChange={(e) => {
          const [mes, anio] = e.target.value.split("-");
          setForm({
            ...form,
            mes: parseInt(mes) || "",
            anio: parseInt(anio) || "",
          });
        }}
      >
        <option value="">Todos los movimientos</option>
        {periodos?.map(({ mes, anio, nombreMes }) => (
          <option key={`${mes}-${anio}`} value={`${mes}-${anio}`}>
            {`${nombreMes} ${anio}`}
          </option>
        ))}
      </select>
      </div>
    <DataGrid
    dataSource={dataGridRows}
    rowAlternationEnabled={true}
    scrolling={false}
    showBorders
    className={styles.dataGrid}
    onCellPrepared={(e) => {
    if (e.rowType === "data" && e.column.dataField === "total") {
      e.cellElement.style.fontWeight = "bold";
    }
    if (e.rowType === "data" && e.data.dominio === "TOTAL") {
      e.cellElement.style.fontWeight = "bold";
      e.cellElement.style.backgroundColor = "#f0f0f0";
    }
  }}
    >
    <FilterRow visible={true} />

      {columnas?.map(col => (
        col.dataField === "dias_en_mes" ? 
        <Column key={col.dataField} {...col} 
         
        />
        :
        
        col.dataField === "dominio" ? 
        <Column key={col.dataField} {...col} cellRender={renderDominio}
         
        />
        :
        <Column key={col.dataField} {...col} 
        customizeText={col.dataType === 'number' ? (e) => Math.trunc(e.value).toLocaleString() 
            : (e) => Math.trunc(parseInt(e.value)).toLocaleString()}
/*         format={col.forceFixedZero ? { type: 'fixedPoint', precision: 0 } : undefined} */
  />
      ))}
      <Summary>
  {columnas?.map(col => (
    typeof col.dataField === "string" &&
    col.dataField !== "dominio"  &&
    col.dataField !== "total"  &&
    col.dataField !== "dias_en_mes" &&
    <TotalItem
        key={col.dataField}
        column={col.dataField}
        summaryType="sum"
        displayFormat="{0}"         
        customizeText={(e) => Math.trunc(e.value).toLocaleString()}
    />
        ))}
    <TotalItem
        column="total"
        summaryType="sum"
        displayFormat="{0}" 
        customizeText={(e) => Math.trunc(e.value).toLocaleString()}
        cssClass={styles.totalItem}
    />
    </Summary>
    </DataGrid>
    
    </div>
  )
}

export default ReporteFichasVehiculos