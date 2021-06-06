var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, MinLength, ValidateNested } from 'class-validator';
class CrearPlanillaTallerDto {
}
__decorate([
    ValidateNested(),
    __metadata("design:type", Object)
], CrearPlanillaTallerDto.prototype, "asignaturaId", void 0);
__decorate([
    ValidateNested(),
    __metadata("design:type", Object)
], CrearPlanillaTallerDto.prototype, "profesorId", void 0);
__decorate([
    ValidateNested(),
    IsOptional(),
    __metadata("design:type", Object)
], CrearPlanillaTallerDto.prototype, "curso", void 0);
__decorate([
    ValidateNested(),
    IsOptional(),
    __metadata("design:type", Object)
], CrearPlanillaTallerDto.prototype, "cicloLectivo", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", Date)
], CrearPlanillaTallerDto.prototype, "fechaInicio", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", Date)
], CrearPlanillaTallerDto.prototype, "fechaFinalizacion", void 0);
__decorate([
    IsString({ message: 'La observación no ha sido ingresado' }),
    MinLength(7, {
        message: 'La observación es muy corto',
    }),
    MaxLength(100, {
        message: 'La observación no puede superar los 100 caracteres',
    }),
    __metadata("design:type", String)
], CrearPlanillaTallerDto.prototype, "observacion", void 0);
__decorate([
    IsString({ message: 'El bimestre no ha sido ingresado' }),
    MinLength(4, {
        message: 'El bimestre es muy corto',
    }),
    MaxLength(100, {
        message: 'El bimestre no puede superar los 100 caracteres',
    }),
    __metadata("design:type", String)
], CrearPlanillaTallerDto.prototype, "bimestre", void 0);
__decorate([
    IsString({ message: 'El tipo de calendario no ha sido ingresado' }),
    IsOptional(),
    __metadata("design:type", String)
], CrearPlanillaTallerDto.prototype, "tipoCalendario", void 0);
__decorate([
    IsString({ message: 'El turno no ha sido ingresado' }),
    MinLength(4, {
        message: 'El turno es muy corto',
    }),
    MaxLength(100, {
        message: 'El turno no puede superar los 100 caracteres',
    }),
    IsOptional(),
    __metadata("design:type", String)
], CrearPlanillaTallerDto.prototype, "turno", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CrearPlanillaTallerDto.prototype, "fechaCreacion", void 0);
__decorate([
    IsDateString(),
    IsOptional(),
    __metadata("design:type", String)
], CrearPlanillaTallerDto.prototype, "fechaModificacion", void 0);
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], CrearPlanillaTallerDto.prototype, "activo", void 0);
export default CrearPlanillaTallerDto;
//# sourceMappingURL=planillaTaller.dto.js.map