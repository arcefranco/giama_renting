import Select from 'react-select';
import localStyles from './ConceptoLinea.module.css';

const ConceptoLinea = ({ index, concepto, eliminarLinea, conceptosFiltrados, handleChangeConcepto, styles, customStylesProveedores }) => {
    return (
        <div className={styles.container7}>
            <div className={styles.inputContainer}>
                <span>Concepto</span>
                <Select
                    options={conceptosFiltrados}
                    value={
                        conceptosFiltrados?.find(
                            (opt) => String(opt.value) === String(concepto.id_concepto)
                        ) || null
                    }
                    onChange={(option) => {
                        handleChangeConcepto(index, { target: { name: 'id_concepto', value: option?.value || "" } });
                    }}
                    placeholder="Seleccione un concepto"
                    filterOption={(option, inputValue) =>
                        option.data.searchKey.includes(inputValue.toLowerCase())
                    }
                    styles={customStylesProveedores}
                />
            </div>
            <div className={styles.inputContainer}>
                <span>Neto no gravado</span>
                <input type="text" name='neto_no_gravado' value={concepto.neto_no_gravado} onChange={(e) => handleChangeConcepto(index, e)} />
            </div>
            <div className={styles.inputContainer}>
                <span>Neto al 21%</span>
                <input type="text" name='neto_21' value={concepto.neto_21} onChange={(e) => handleChangeConcepto(index, e)} />
            </div>
            <div className={styles.inputContainer}>
                <span>Neto al 10,5%</span>
                <input type="text" name='neto_10' value={concepto.neto_10} onChange={(e) => handleChangeConcepto(index, e)} />
            </div>
            <div className={styles.inputContainer}>
                <span>Neto al 27%</span>
                <input type="text" name='neto_27' value={concepto.neto_27} onChange={(e) => handleChangeConcepto(index, e)} />
            </div>
            <div className={styles.inputContainer}>
                <span>Excluir de Prorrateo</span>
                <input type="number" name='importe_excluido' value={concepto.importe_excluido} onChange={(e) => handleChangeConcepto(index, e)} />
            </div>
            <div className={styles.inputContainer} style={{ alignItems: 'center' }}>
                {index >= 3 && (
                  <button 
                    type="button" 
                    className={localStyles.removeBtn}
                    title="Eliminar concepto"
                    onClick={() => eliminarLinea(index)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                )}
            </div>
        </div>
    )
}

export default ConceptoLinea;