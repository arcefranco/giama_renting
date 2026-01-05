import React from 'react'
import DataGrid, { Column, Scrolling, Summary, TotalItem } from "devextreme-react/data-grid"
import styles from "./PagosClientes.module.css"
import Select from "react-select"

const PagosClientes = () => {
    const customStyles = {
        container: (provided) => ({
            ...provided,
            width: '18rem',
            fontSize: "10px"
        })
    };
    const array = [
        {
            concepto: "Alquiler AH666AR 01/01/2026 - 07/01/2026",
            fecha_cobro: "01/01/2026",
            debe: 200000,
            saldo: 200000
        },
        {
            concepto: "Depósito en garantía AH666AR",
            fecha_cobro: "01/01/2026",
            debe: 50000,
            saldo: 250000
        },
        {
            concepto: "Telepase + [observación]",
            fecha_cobro: "02/01/2026",
            debe: 8000,
            saldo: 258000
        },
        {
            concepto: "Transferencia + [observación]",
            fecha_cobro: "01/01/2026",
            haber: 250000,
            saldo: 8000
        },
    ]
    return (

        <div className={styles.container}>
            <h2>Pagos clientes</h2>
            <div style={{
                display: "flex",
                columnGap: "15rem"
            }}>

                <div className={styles.inputWrapper} >
                    <span>Clientes</span>
                    <div className={styles.selectWithIcon} style={{
                        width: "20rem"
                    }}>
                        <Select
                            placeholder="Seleccione un cliente"
                            styles={customStyles}
                            options={[{
                                value: 1,
                                label: "20122267947 Daniel Esteban Godoy"
                            }]}

                        />
                    </div>
                </div>


            </div>

            <button className={styles.refreshButton}>
                🔄 Actualizar
            </button>
            <DataGrid
                className={styles.dataGrid}
                dataSource={array}
                showBorders={true}
                style={{ fontFamily: "IBM" }}
                rowAlternationEnabled={true}
                allowColumnResizing={true}
                scrolling={true}
                height={300}

                columnAutoWidth={true}>
                <Scrolling mode="standard" />
                <Column dataField="fecha_cobro" caption="Fecha de cobro" width={120} />
                <Column dataField="concepto" width={100} caption="Concepto" />
                <Column dataField="debe" alignment="right" caption="Debe" />
                <Column dataField="haber" alignment="right" caption="Haber" />
                <Column dataField="saldo" alignment="right" caption="Saldo" />
            </DataGrid>
            <h2>Alta pagos clientes</h2>
            <div className={styles.formContainer} >
                <form action="" enctype="multipart/form-data" className={styles.form} style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    justifyContent: "space-around"
                }}>



                    <div className={styles.inputContainer}>
                        <span>Forma de cobro</span>
                        <select name="id_forma_cobro"
                            id="">
                            <option value={""} disabled selected>{"Seleccione una opción"}</option>
                        </select>
                    </div>
                    <div className={styles.inputContainer}>
                        <span>Fecha de cobro</span>
                        <input type="date" />
                    </div>

                    <div className={styles.inputContainer}>
                        <span>Importe</span>
                        <input type="number" />
                    </div>


                    <div className={styles.inputContainer}>
                        <span>Observacion</span>
                        <textarea />
                    </div>
                    {/*    </div> */}
                </form>
                <button
                    className={styles.sendBtn}

                >
                    Enviar
                </button>

            </div>
        </div>
    )
}

export default PagosClientes