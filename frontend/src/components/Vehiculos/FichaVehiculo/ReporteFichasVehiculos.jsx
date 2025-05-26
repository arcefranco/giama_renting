import React, {useEffect, useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {getAllCostosPeriodo, getAllAlquileresPeriodo} from '../../../reducers/Vehiculos/vehiculosSlice'
import {getConceptosCostos} from '../../../reducers/Costos/costosSlice'
import styles from './FichaVehiculo.module.css'
import { ClipLoader } from 'react-spinners';
import DataGrid, {Column, Scrolling, Export, SearchPanel, 
    FilterRow, HeaderFilter, Paging} from "devextreme-react/data-grid"
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
    dispatch(getConceptosCostos()),
    dispatch(getAllAlquileresPeriodo(form)),
    dispatch(getAllCostosPeriodo(form))
])

},[])

const nombresMeses = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];
const generarPeriodos = () => {
  const hoy = new Date();
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 2); // dos meses adelante
  const inicio = new Date(2024, 0); // enero 2024
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
fichaAllAlquileres, vehiculos } = useSelector(state => state.vehiculosReducer);
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
      const normalizados = fichaAllAlquileres.flat().map(item => ({
        id: item.id_vehiculo,
        dominio: item.dominio,
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
      const conceptosPorNombre = conceptos.map(c => c.nombre.toLowerCase().replaceAll(" ", "_"));
      const vehiculoIds = new Set([
        ...alquileresNormalizados?.map(a => a.id),
        ...Object.keys(costosAgrupados).map(id => parseInt(id)),
      ]);

      const rows = Array.from(vehiculoIds).map(id => {
        const alquilerData = alquileresNormalizados?.find(a => a.id === id) || {};
        const costos = costosAgrupados[id] || {};

        const row = {
        vehiculo: vehiculos?.find(v => v.id === id)?.dominio || `ID ${id}`, 
        dominio: alquilerData.dominio,
        alquiler: parseFloat(alquilerData.alquiler) || 0,
        dias_en_mes: alquilerData.dias_en_mes || 0,
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

        row.total = (row.alquiler || 0) + (totalIngresos - totalEgresos);

        return row;
      });

      setDataGridRows(rows);
    }
}, [alquileresNormalizados, costosAgrupados, conceptos]);

const columnas = [
    { dataField: "dominio", caption: "Vehículo" },
    { dataField: "alquiler", caption: "Alquiler" },
    { dataField: "dias_en_mes", caption: "Días (alquiler)" },
    ...conceptos.map(c => ({
      dataField: c.nombre?.toLowerCase().replaceAll(" ", "_"),
      caption: c.nombre,
      
    })),
    { dataField: "total", caption: "Total"  },
  ];
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
        {periodos.map(({ mes, anio, nombreMes }) => (
          <option key={`${mes}-${anio}`} value={`${mes}-${anio}`}>
            {`${nombreMes} ${anio}`}
          </option>
        ))}
      </select>
      </div>
    <DataGrid
    dataSource={dataGridRows}
    rowAlternationEnabled={true}
    showBorders
    columnAutoWidth
    className={styles.dataGrid}
    height={500}
    >
    <FilterRow visible={true} />

      {columnas.map(col => ( 
        <Column key={col.dataField} {...col} 
         format={typeof dataGridRows?.[0]?.[col.dataField] === 'number' ? { type: 'fixedPoint', precision: 2 } : undefined}
  />
      ))}
    </DataGrid>
    
    </div>
  )
}

export default ReporteFichasVehiculos