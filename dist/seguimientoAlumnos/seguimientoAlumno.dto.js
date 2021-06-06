var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsBoolean, MaxLength, MinLength, IsNumber, Min, ValidateNested, IsDate, } from 'class-validator';
import UsuarioDto from '../usuario/usuario.dto';
class CrearSeguimientoAlumnoDto {
}
__decorate([
    ValidateNested(),
    __metadata("design:type", Object)
], CrearSeguimientoAlumnoDto.prototype, "alumno", void 0);
__decorate([
    ValidateNested(),
    __metadata("design:type", Object)
], CrearSeguimientoAlumnoDto.prototype, "planillaTaller", void 0);
__decorate([
    IsDate(),
    __metadata("design:type", Date)
], CrearSeguimientoAlumnoDto.prototype, "fecha", void 0);
__decorate([
    IsString({
        message: 'El tipo de seguimiento no ha sido ingresado',
    }),
    MinLength(7, {
        message: 'El tipo de seguimiento es muy corto',
    }),
    MaxLength(100, {
        message: 'El tipo de seguimiento no puede superar los 100 caracteres',
    }),
    __metadata("design:type", String)
], CrearSeguimientoAlumnoDto.prototype, "tipoSeguimiento", void 0);
__decorate([
    IsNumber(),
    Min(0, { message: 'El ciclo lectivo tiene que ser mayor a 0' }),
    __metadata("design:type", Number)
], CrearSeguimientoAlumnoDto.prototype, "cicloLectivo", void 0);
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], CrearSeguimientoAlumnoDto.prototype, "resuelto", void 0);
__decorate([
    IsString({
        message: 'La observacion no ha sido ingresada',
    }),
    MinLength(7, {
        message: 'La observacion es muy corta',
    }),
    MaxLength(100, {
        message: 'La observacion no puede superar los 100 caracteres',
    }),
    __metadata("design:type", String)
], CrearSeguimientoAlumnoDto.prototype, "observacion", void 0);
__decorate([
    IsString({
        message: 'La observacion 2 no ha sido ingresada',
    }),
    MinLength(7, {
        message: 'La observacion 2 es muy corta',
    }),
    MaxLength(100, {
        message: 'La observacion 2 no puede superar los 100 caracteres',
    }),
    __metadata("design:type", String)
], CrearSeguimientoAlumnoDto.prototype, "observacion2", void 0);
__decorate([
    IsString({
        message: 'La observacion del jefe de taller no ha sido ingresado',
    }),
    MinLength(7, {
        message: 'La observacion del jefe de taller  es muy corto',
    }),
    MaxLength(100, {
        message: 'La observacion del jefe de taller no puede superar los 100 caracteres',
    }),
    __metadata("design:type", String)
], CrearSeguimientoAlumnoDto.prototype, "observacionJefe", void 0);
__decorate([
    IsOptional(),
    IsDate(),
    __metadata("design:type", String)
], CrearSeguimientoAlumnoDto.prototype, "fechaCreacion", void 0);
__decorate([
    IsOptional(),
    ValidateNested(),
    __metadata("design:type", UsuarioDto)
], CrearSeguimientoAlumnoDto.prototype, "creadoPor", void 0);
__decorate([
    IsOptional(),
    ValidateNested(),
    __metadata("design:type", UsuarioDto)
], CrearSeguimientoAlumnoDto.prototype, "modificadoPor", void 0);
__decorate([
    IsDate(),
    IsOptional(),
    __metadata("design:type", String)
], CrearSeguimientoAlumnoDto.prototype, "fechaModificacion", void 0);
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], CrearSeguimientoAlumnoDto.prototype, "activo", void 0);
export default CrearSeguimientoAlumnoDto;
//# sourceMappingURL=seguimientoAlumno.dto.js.map