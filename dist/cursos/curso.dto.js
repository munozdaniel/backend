var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, MinLength, IsNumber, Min } from 'class-validator';
class CrearCursoDto {
}
__decorate([
    IsString({ message: 'La comision no ha sido ingresada' }),
    MinLength(1, {
        message: 'La comision es muy corto',
    }),
    MaxLength(2, {
        message: 'La comision no puede superar los 100 caracteres',
    }),
    __metadata("design:type", String)
], CrearCursoDto.prototype, "comision", void 0);
__decorate([
    IsNumber(),
    Min(0, { message: 'El curso tiene que ser mayor a 0' }),
    __metadata("design:type", Number)
], CrearCursoDto.prototype, "curso", void 0);
__decorate([
    IsNumber(),
    Min(0, { message: 'La division tiene que ser mayor a 0' }),
    __metadata("design:type", Number)
], CrearCursoDto.prototype, "division", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CrearCursoDto.prototype, "fechaCreacion", void 0);
__decorate([
    IsDateString(),
    IsOptional(),
    __metadata("design:type", String)
], CrearCursoDto.prototype, "fechaModificacion", void 0);
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], CrearCursoDto.prototype, "activo", void 0);
export default CrearCursoDto;
//# sourceMappingURL=curso.dto.js.map