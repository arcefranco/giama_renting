import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from "react-redux"
import DataGrid, {
    Column, Scrolling, Paging, TotalItem, Summary, Lookup,
    SearchPanel, HeaderFilter, FilterRow, Export
} from "devextreme-react/data-grid"
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from 'react-toastify';
import { useToastFeedback } from '../../customHooks/useToastFeedback.jsx';
import { reset, getRecibosByFormaCobro } from '../../reducers/Recibos/recibosSlice.js'
import { getFormasDeCobro } from '../../reducers/Generales/generalesSlice.js';
import styles from "./ReporteRecibos.module.css"

const RecibosFormaCobro = () => {
    const dispatch = useDispatch()
    useEffect(() => {
        dispatch(getFormasDeCobro())
        return () => {
            dispatch(reset())
        }
    }, [dispatch])
    const [form, setForm] = useState({
        id_forma_cobro: ''
    })
    useEffect(() => {
        if (form.id_forma_cobro) {
            dispatch(getRecibosByFormaCobro(form))
        }
    }, [form.id_forma_cobro])
    const {
        recibos_forma_cobro,
        isLoading,
        message,
        isError,
        isSuccess,
    } = useSelector((state) => state.recibosReducer)
    const { formasDeCobro } = useSelector((state) => state.generalesReducer)

    useToastFeedback({
        isError,
        isSuccess,
        message,
        resetAction: reset,
    })
    const handleActualizar = () => {
        dispatch(getRecibos())
    }
    const renderFecha = (data) => {
        if (data.value) {
            let fechaSplit = data?.value?.split("-")
            return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`
        }
    }
    const calculateFechaFilter = (filterValue, operation) => {
        if (!filterValue) {
            return null;
        }

        // Expresión regular que valida el formato DD/MM/YYYY (o DD-MM-YYYY)
        const dateRegex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
        const match = filterValue.match(dateRegex);

        if (match) {
            // match[1]=Día, match[2]=Mes, match[3]=Año
            const [full, day, month, year] = match;

            // Aseguramos que Mes y Día tengan dos dígitos
            const normalizedDay = day.padStart(2, '0');
            const normalizedMonth = month.padStart(2, '0');

            // Transformar a formato YYYY-MM-DD
            const formattedDate = `${year}-${normalizedMonth}-${normalizedDay}`;

            // Devolver la expresión de filtro
            // [dataField, 'operacion', valor_formateado_a_YMD]
            return ["fecha", operation, formattedDate];

        }

        // Si no es un formato DD/MM/YYYY válido, se busca el valor tal cual
        return ["fecha", operation, filterValue];
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value
        })
    }
    return (
        <div className={styles.container}>
            <ToastContainer />
            {isLoading && (
                <div className={styles.spinnerOverlay}>
                    <ClipLoader
                        size={60}
                        color="#800020" // bordó
                        loading={true}
                    />
                    <span className={styles.loadingText}>Cargando recibos...</span>
                </div>
            )}
            <h2>Listado de recibos por forma de cobro</h2>
            <div className={styles.filter}>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    columnGap: "4rem"
                }}>
                    <div className={styles.inputContainer}>
                        <span>Forma de cobro </span>
                        <select name="id_forma_cobro" value={form["id_forma_cobro"]} onChange={handleChange}>
                            <option value={""} disabled selected>{"Seleccione una forma de cobro"}</option>
                            {
                                formasDeCobro?.length && formasDeCobro.map(e => (
                                    <option key={e.id} value={e.id}>
                                        {e.nombre}
                                    </option>
                                ))
                            }
                        </select>
                    </div>
                </div>
            </div>
            <button onClick={handleActualizar} className={styles.refreshButton}>
                🔄 Actualizar reporte
            </button>
            <DataGrid
                className={styles.dataGrid}
                dataSource={recibos_forma_cobro || []}
                showBorders={true}
                style={{ fontFamily: "IBM" }}
                rowAlternationEnabled={true}
                allowColumnResizing={true}
                columnAutoWidth={true}
                height={400}
            /*                 onExporting={onExporting} */
            >
                <Scrolling mode="standard" />
                <Paging defaultPageSize={10} />
                <Column dataField="id_recibo" caption="Nro. Recibo" width={100} alignment="left" />
                <Column
                    dataField="fecha"
                    caption="Fecha"
                    cellRender={renderFecha}
                    alignment="center"
                    dataType="string" // Forzar editor de texto
                    allowSearch={true}
                    allowHeaderFiltering={false} // Eliminar el desplegable del encabezado
                    calculateFilterExpression={calculateFechaFilter}
                />
                <Column dataField="detalle" caption="Detalle" alignment="right" allowFiltering={false} allowHeaderFiltering={true} />
                <Column dataField="importe" caption="Importe" alignment="right" allowFiltering={false} allowHeaderFiltering={true} />
            </DataGrid>
        </div>
    )
}

export default RecibosFormaCobro