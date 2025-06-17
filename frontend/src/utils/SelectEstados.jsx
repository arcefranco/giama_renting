import React from "react";
import Select from "react-select";

const getColorById = (id) => {
  switch (id) {
    case 1:
      return "#ff0909a1"; // rojo
    case 2:
      return "#ffa809a1"; // amarillo
    case 3:
      return "black";     // negro
    case 4:
      return "#61c2ff";    // naranja
    default:
      return "#ccc";      // gris por defecto
  }
};

const SelectEstados = ({ estados = [], value, onChange, placeholder = "Seleccione un estado" }) => {
  const options = estados.map((e) => ({
    value: e.id,
    label: (
      <span
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "16px",
          borderRadius: "4px",
          width: "10rem",
          height: "1rem",
          padding: "3px 6px",
          marginLeft: ".5rem",
          backgroundColor: getColorById(e.id),
          color: "white",
        }}
      >
        {e.nombre}
      </span>
    ),
  }));

  const selectedOption = options.find(opt => opt.value === value);

  const customStyles = {
  control: (provided) => ({
    ...provided,
    minHeight: '40px',
    minWidth: '250px', // ancho del Select
  }),
  menu: (provided) => ({
    ...provided,
    minWidth: '250px', // ancho del dropdown
    zIndex: 9999, // por si se superpone con otros elementos
  }),
  menuList: (provided) => ({
    ...provided,
    padding: 0,
  }),
  option: (provided, state) => ({
    ...provided,
    padding: '8px 12px',
    backgroundColor: state.isFocused ? '#eee' : 'white',
    cursor: 'pointer',
  }),
  singleValue: (provided) => ({
    ...provided,
    display: 'flex',
    alignItems: 'center',
  }),
};

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={(option) => onChange(option?.value)}
      placeholder={placeholder}
      styles={customStyles}
    />
  );
};

export default SelectEstados;