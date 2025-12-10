// SelectEstados.jsx
import React from "react";
import Select from "react-select";
import { getColorByEstadoId } from "./estadosVehiculoConfig";

const SelectEstados = ({
  estados = [], // viene de la base: id + nombre
  value,
  onChange,
  disabled,
  placeholder = "Seleccione un estado",
}) => {
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
          backgroundColor: getColorByEstadoId(e.id),
          color: "white",
        }}
      >
        {e.nombre}
      </span>
    ),
  }));

  const selectedOption = options.find((opt) => opt.value === value);

  const customStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "40px",
      minWidth: "250px",
    }),
    menu: (provided) => ({
      ...provided,
      minWidth: "250px",
      zIndex: 9999,
    }),
    menuList: (provided) => ({
      ...provided,
      padding: 0,
    }),
    option: (provided, state) => ({
      ...provided,
      padding: "8px 12px",
      backgroundColor: state.isFocused ? "#eee" : "white",
      cursor: "pointer",
    }),
    singleValue: (provided) => ({
      ...provided,
      display: "flex",
      alignItems: "center",
    }),
  };

  return (
    <Select
      isDisabled={disabled}
      options={options}
      value={selectedOption}
      onChange={(option) => onChange(option?.value)}
      placeholder={placeholder}
      styles={customStyles}
    />
  );
};

export default SelectEstados;