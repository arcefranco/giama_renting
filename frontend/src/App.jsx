import { Routes, Route } from "react-router-dom";
import VehiculosForm from './components/Vehiculos/VehiculosForm';
import Login from './components/Login/Login'
import MainLayout from './layouts/MainLayout';
import Home from './components/Home/Home';
import ProtectedRoute from './ProtectedRoute';
import ReporteVehiculos from './components/Vehiculos/ReporteVehiculos';
import ImagenesVehiculo from './components/Vehiculos/ImagenesVehiculo';
import UpdateVehiculo from './components/Vehiculos/UpdateVehiculo/UpdateVehiculo';
import './App.css'
import ClientesForm from './components/Clientes/ClientesForm';
import ReporteClientes from './components/Clientes/ReporteClientes';
import ImagenesClientes from './components/Clientes/ImagenesClientes';
import UpdateCliente from './components/Clientes/UpdateCliente';
import AltaCostos from './components/Costos/AltaCostos';
import UpdateConcepto from './components/Costos/UpdateConcepto';
import Ingresos from "./components/Costos/Ingresos";
import FormasDeCobro from './components/Alquileres/FormasDeCobro/FormasDeCobro';
import AlquileresForm from './components/Alquileres/AlquileresForm/AlquileresForm';
import ProrrateoIE from './components/Costos/ProrrateoIE';
import FichaVehiculo from './components/Vehiculos/FichaVehiculo/FichaVehiculo';
import ReporteFichasVehiculos from './components/Vehiculos/FichaVehiculo/ReporteFichasVehiculos';
import ReporteAlquileres from './components/Alquileres/ReporteAlquileres/ReporteAlquileres';
import AltaUsuario from './components/Usuarios/AltaUsuario/AltaUsuario';
import AltaPassword from './components/Usuarios/Password/AltaPassword';
import RecoveryPass from './components/Usuarios/Password/RecoveryPass';
import ContratoAlquiler from './components/Alquileres/ContratoAlquiler/ContratoAlquiler';
import ReporteContratos from './components/Alquileres/ReporteContratos/ReporteContratos';
import SituacionFlota from './components/Vehiculos/SituacionFlota/SituacionFlota';
import ImportacionMasiva from './components/Vehiculos/ImportacionMasiva';
import PrivateRoute from "./utils/PrivateRoute";
import Unauthorized from "./utils/Unauthorized";
import AdminRoute from "./utils/AdminRoute";
import Egresos from "./components/Costos/Egresos";
import Modelos from "./components/Parametros/Modelos/Modelos";
import ProveedoresGPS from "./components/Parametros/ProveedoresGPS/ProveedoresGPS";
import Sucursales from "./components/Parametros/Sucursales/Sucursales";
import UpdateProveedorGPS from "./components/Parametros/ProveedoresGPS/UpdateProveedorGPS";
import UpdateModelo from "./components/Parametros/Modelos/UpdateModelo";
import UpdateSucursal from "./components/Parametros/Sucursales/UpdateSucursal";
import ReporteRecibos from "./components/Recibos/ReporteRecibos";
import UpdateContrato from "./components/Alquileres/ContratoAlquiler/UpdateContrato";
function App() {

  return (
    <Routes>
      {/* Rutas sin header */}
      <Route path="/" element={<Login />} />
      <Route path="/password/:token" element={<AltaPassword />} />
      <Route path="/recovery" element={<RecoveryPass />} />
      {/* Rutas con header y protección */}

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/home" element={<Home />} />
          <Route element={<AdminRoute />}>
            <Route path='/usuarios/alta' element={<AltaUsuario />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["2"]} />}>
            <Route path="/vehiculos" element={<VehiculosForm />} />
          </Route>
          <Route path="/vehiculosReporte" element={<ReporteVehiculos />} />
          <Route element={<PrivateRoute allowedRoles={["3", "4"]} />}>
            <Route path='/vehiculos/imagenes/:id' element={<ImagenesVehiculo />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["2", "4"]} />}>
            <Route path='/vehiculos/actualizar/:id' element={<UpdateVehiculo />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["5"]} />}>
            <Route path='/vehiculos/ficha/:id' element={<FichaVehiculo />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["5"]} />}>
            <Route path='/vehiculos/ficha/:id/:anio/:mes' element={<FichaVehiculo />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["5"]} />}>
            <Route path='/vehiculos/ficha/reporte' element={<ReporteFichasVehiculos />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["5"]} />}>
            <Route path="/vehiculos/situacionFlota" element={<SituacionFlota />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["2"]} />}>
            <Route path="/vehiculos/importacionMasiva" element={<ImportacionMasiva />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["3"]} />}>
            <Route path="/clientes" element={<ClientesForm />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["5"]} />}>
            <Route path='/clientesReporte' element={<ReporteClientes />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["3", "4"]} />}>
            <Route path='/clientes/imagenes/:id' element={<ImagenesClientes />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["3"]} />}>
            <Route path='/clientes/actualizar/:id' element={<UpdateCliente />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["2"]} />}>
            <Route path='/costos/alta/ingresos' element={<AltaCostos />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["2"]} />}>
            <Route path='/costos/alta/egresos' element={<AltaCostos />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["2"]} />}>
            <Route path='/costos/conceptos/:id' element={<UpdateConcepto />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["2"]} />}>
            <Route path='/costos/ingresos' element={<Ingresos />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["2"]} />}>
            <Route path='/costos/egresos' element={<Egresos />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["2"]} />}>
            <Route path='/costos/ingresos/:id' element={<Ingresos />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["2"]} />}>
            <Route path='/costos/egresos/:id' element={<Egresos />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["2"]} />}>
            <Route path='/costos/prorrateoIE' element={<ProrrateoIE />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["2"]} />}>
            <Route path='/alquileres/contrato' element={<ContratoAlquiler />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["2"]} />}>
            <Route path='/contrato/actualizar/:id' element={<UpdateContrato />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["3"]} />}>
            <Route path='/contrato/actualizar/:id/:vehiculo' element={<UpdateContrato />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["2"]} />}>
            <Route path='/alquileres/:idContrato' element={<AlquileresForm key={location.pathname} />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["2"]} />}>
            <Route path='/alquileres/formasDeCobro' element={<FormasDeCobro />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["5"]} />}>
            <Route path="/recibos/reporte" element={<ReporteRecibos />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["5"]} />}>
            <Route path='/alquileres/reporte' element={<ReporteAlquileres />} />
          </Route>
          <Route element={<PrivateRoute allowedRoles={["5"]} />}>
            <Route path='/alquileres/contrato/reporte' element={<ReporteContratos />} />
          </Route>

          <Route path='/parametros/proveedoresGPS' element={<ProveedoresGPS />} />
          <Route path='/parametros/proveedoresGPS/:id' element={<UpdateProveedorGPS />} />
          <Route path='/parametros/modelos' element={<Modelos />} />
          <Route path='/parametros/modelos/:id' element={<UpdateModelo />} />
          <Route path='/parametros/sucursales' element={<Sucursales />} />
          <Route path='/parametros/sucursales/:id' element={<UpdateSucursal />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App
