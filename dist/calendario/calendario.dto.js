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
class CrearAsistenciaDto {
}
__decorate([
    ValidateNested(),
    __metadata("design:type", Object)
], CrearAsistenciaDto.prototype, "planillaTaller", void 0);
__decorate([
    ValidateNested(),
    __metadata("design:type", Object)
], CrearAsistenciaDto.prototype, "alumno", void 0);
__decorate([
    ValidateNested(),
    __metadata("design:type", Object)
], CrearAsistenciaDto.prototype, "profesor", void 0);
__decorate([
    IsString({
        message: "La forma de examen no ha sido ingresada",
    }),
    MinLength(7, {
        message: "La forma de examen es muy corta",
    }),
    MaxLength(100, {
        message: "La forma de examen no puede superar los 100 caracteres",
    }),
    __metadata("design:type", String)
], CrearAsistenciaDto.prototype, "formaExamen", void 0);
__decorate([
    IsString({
        message: "El tipo de examen no ha sido ingresado",
    }),
    MinLength(7, {
        message: "El tipo de examen es muy corto",
    }),
    MaxLength(100, {
        message: "El tipo de examen no puede superar los 100 caracteres",
    }),
    __metadata("design:type", String)
], CrearAsistenciaDto.prototype, "tipoExamen", void 0);
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], CrearAsistenciaDto.prototype, "promedia", void 0);
__decorate([
    IsNumber(),
    Min(0, { message: "El promedio general tiene que ser mayor a 0" }),
    __metadata("design:type", Number)
], CrearAsistenciaDto.prototype, "promedioGeneral", void 0);
__decorate([
    IsString({
        message: "La observacion no ha sido ingresada",
    }),
    MinLength(7, {
        message: "La observacion es muy corta",
    }),
    MaxLength(100, {
        message: "La observacion no puede superar los 100 caracteres",
    }),
    __metadata("design:type", String)
], CrearAsistenciaDto.prototype, "observaciones", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CrearAsistenciaDto.prototype, "fechaCreacion", void 0);
__decorate([
    IsDateString(),
    IsOptional(),
    __metadata("design:type", String)
], CrearAsistenciaDto.prototype, "fechaModificacion", void 0);
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], CrearAsistenciaDto.prototype, "activo", void 0);
export default CrearAsistenciaDto;
//# sourceMappingURL=calendario.dto.js.map