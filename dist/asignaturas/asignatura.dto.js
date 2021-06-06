var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsBoolean, IsNumber, IsDateString, MaxLength, MinLength, Min, Max, } from 'class-validator';
class CrearAsignaturaDto {
}
__decorate([
    IsString({ message: 'El detalle no ha sido ingresado' }),
    MinLength(5, {
        message: 'El detalle es muy corto',
    }),
    MaxLength(50, {
        message: 'El detalle no puede superar los 50 caracteres',
    }),
    __metadata("design:type", String)
], CrearAsignaturaDto.prototype, "detalle", void 0);
__decorate([
    IsString({ message: 'El tipo de asignatura no ha sido ingresado' }),
    MinLength(4, {
        message: 'El tipo de asignatura es muy corto',
    }),
    MaxLength(15, {
        message: 'El tipo de asignatura no puede superar los 15 caracteres',
    }),
    __metadata("design:type", String)
], CrearAsignaturaDto.prototype, "tipoAsignatura", void 0);
__decorate([
    IsString({ message: 'El tipo de asignatura no ha sido ingresado' }),
    MinLength(7, {
        message: 'El tipo de ciclo es muy corto',
    }),
    MaxLength(15, {
        message: 'El tipo de ciclo no puede superar los 15 caracteres',
    }),
    __metadata("design:type", String)
], CrearAsignaturaDto.prototype, "tipoCiclo", void 0);
__decorate([
    IsString({ message: 'El tipo de formación no ha sido ingresado' }),
    MinLength(7, {
        message: 'El tipo de formación es muy corto',
    }),
    MaxLength(50, {
        message: 'El tipo de formación no puede superar los 50 caracteres',
    }),
    __metadata("design:type", String)
], CrearAsignaturaDto.prototype, "tipoFormacion", void 0);
__decorate([
    IsNumber({ allowNaN: false }, {
        message: 'El curso debe ser numerico',
    }),
    Min(1, { message: 'El curso no puede ser menor a 1' }),
    Max(6, { message: 'El curso no puede ser mayor a 6' }),
    __metadata("design:type", Number)
], CrearAsignaturaDto.prototype, "curso", void 0);
__decorate([
    IsNumber({ allowNaN: false }, {
        message: 'Los meses deben ser numerico',
    }),
    Min(0, { message: 'Los meses no pueden ser menor a 0' }),
    Max(12, { message: 'Los meses no pueden ser mayor a 12' }),
    __metadata("design:type", Number)
], CrearAsignaturaDto.prototype, "meses", void 0);
__decorate([
    IsNumber({ allowNaN: false }, {
        message: 'Los meses deben ser numerico',
    }),
    Min(0, { message: 'Las horas catedra anuales no pueden ser menor a 0hs' }),
    Max(500, { message: 'La horas catedra anuales no pueden superar las 500hs' }),
    __metadata("design:type", Number)
], CrearAsignaturaDto.prototype, "horasCatedraAnuales", void 0);
__decorate([
    IsNumber({ allowNaN: false }, {
        message: 'Los meses deben ser numerico',
    }),
    Min(0, { message: 'Las horas catedra semanales no pueden ser menor a 0hs' }),
    Max(500, {
        message: 'La horas catedra semanales no pueden superar las 500hs',
    }),
    __metadata("design:type", Number)
], CrearAsignaturaDto.prototype, "horasCatedraSemanales", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CrearAsignaturaDto.prototype, "fechaCreacion", void 0);
__decorate([
    IsDateString(),
    IsOptional(),
    __metadata("design:type", String)
], CrearAsignaturaDto.prototype, "fechaModificacion", void 0);
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], CrearAsignaturaDto.prototype, "activo", void 0);
export default CrearAsignaturaDto;
//# sourceMappingURL=asignatura.dto.js.map