var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, MinLength, } from 'class-validator';
class CrearAlumnoDto {
}
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "_id", void 0);
__decorate([
    IsString(),
    MinLength(4, {
        message: 'El nombre del Padre/Madre/Tutor es muy corto',
    }),
    MaxLength(50, {
        message: 'El nombre del Padre/Madre/Tutor no puede superar los 9 digitos',
    }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "nombreCompleto", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MinLength(4, {
        message: 'El telefono del  Padre/Madre/Tutor debe contener al menos 4 caracteres',
    }),
    MaxLength(50, {
        message: 'El telefono del   Padre/Madre/Tutor debe contener 50 caracteres máximo',
    }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "telefono", void 0);
__decorate([
    IsString(),
    MinLength(4, {
        message: 'El celular del Padre/Madre/Tutor debe contener al menos 4 caracteres',
    }),
    MaxLength(50, {
        message: 'El celular del Padre/Madre/Tutor debe contener 50 caracteres máximo',
    }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "celular", void 0);
__decorate([
    IsString(),
    MinLength(4, {
        message: 'El email del Padre/Madre/Tutor debe contener al menos 4 caracteres',
    }),
    MaxLength(70, {
        message: 'El email del Padre/Madre/Tutor debe contener 70 caracteres máximo',
    }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "email", void 0);
__decorate([
    IsString(),
    MinLength(5, {
        message: 'El tipoAdulto debe contener al menos 5 caracteres',
    }),
    MaxLength(5, {
        message: 'El tipoAdulto debe contener 5 caracteres máximo',
    }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "tipoAdulto", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "fechaCreacion", void 0);
__decorate([
    IsDateString(),
    IsOptional(),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "fechaModificacion", void 0);
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], CrearAlumnoDto.prototype, "activo", void 0);
export default CrearAlumnoDto;
//# sourceMappingURL=adulto.dto.js.map