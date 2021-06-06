var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, MinLength, ValidateNested, Min, IsNumber, } from "class-validator";
class CrearTemaDto {
}
__decorate([
    ValidateNested(),
    __metadata("design:type", Object)
], CrearTemaDto.prototype, "planillaTaller", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", Date)
], CrearTemaDto.prototype, "fecha", void 0);
__decorate([
    IsString({ message: "El tema del día no fue ingresado" }),
    MinLength(4, {
        message: "El tema del día debe contener al menos 4 caracteres",
    }),
    MaxLength(100, {
        message: "El tema del día debe contener 100 caracteres máximo",
    }),
    __metadata("design:type", String)
], CrearTemaDto.prototype, "temaDelDia", void 0);
__decorate([
    IsString({ message: "El tipo de desarrollo no fue ingresado" }),
    MinLength(4, {
        message: "El tipo de desarrollo debe contener al menos 4 caracteres",
    }),
    MaxLength(100, {
        message: "El tipo de desarrollo debe contener 100 caracteres máximo",
    }),
    __metadata("design:type", String)
], CrearTemaDto.prototype, "tipoDesarrollo", void 0);
__decorate([
    IsString({ message: "La proxima clase no fue ingresada" }),
    MinLength(4, {
        message: "La proxima clase debe contener al menos 4 caracteres",
    }),
    MaxLength(100, {
        message: "La proxima clase debe contener 100 caracteres máximo",
    }),
    __metadata("design:type", String)
], CrearTemaDto.prototype, "temasProximaClase", void 0);
__decorate([
    IsNumber({ allowNaN: false }, {
        message: "El nro de clase debe ser numerico",
    }),
    Min(0, { message: "El Nro de clase no puede ser menor a 0" }),
    __metadata("design:type", Number)
], CrearTemaDto.prototype, "nroClase", void 0);
__decorate([
    Min(0, { message: "La unidad no puede ser menor a 0" }),
    IsNumber({ allowNaN: false }, {
        message: "La unidad debe ser numerico",
    }),
    __metadata("design:type", Number)
], CrearTemaDto.prototype, "unidad", void 0);
__decorate([
    IsString({
        message: "El caracter de la clase de taller no ha sido ingresado",
    }),
    MinLength(7, {
        message: "El caracter de la clase de taller  es muy corto",
    }),
    MaxLength(100, {
        message: "El caracter de la clase no puede superar los 100 caracteres",
    }),
    __metadata("design:type", String)
], CrearTemaDto.prototype, "caracterClase", void 0);
__decorate([
    IsString({
        message: "La observacion del jefe de taller no ha sido ingresado",
    }),
    MinLength(4, {
        message: "La observacion del jefe de taller  es muy corto",
    }),
    MaxLength(100, {
        message: "La observacion del jefe de taller no puede superar los 100 caracteres",
    }),
    __metadata("design:type", String)
], CrearTemaDto.prototype, "observacionJefe", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CrearTemaDto.prototype, "fechaCreacion", void 0);
__decorate([
    IsDateString(),
    IsOptional(),
    __metadata("design:type", String)
], CrearTemaDto.prototype, "fechaModificacion", void 0);
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], CrearTemaDto.prototype, "activo", void 0);
export default CrearTemaDto;
//# sourceMappingURL=tema.dto.js.map