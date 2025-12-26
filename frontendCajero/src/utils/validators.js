export function validarCuenta(cuenta){
  return /^[0-9]{6,20}$/.test(cuenta);
}
export function validarMonto(monto) {
  if (!monto) return false;

  const regex = /^\d+(,\d{1,2})?$/; 

  return regex.test(monto);
}
