var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, MinLength, IsNumberString } from 'class-validator';
class CrearProfesorDto {
}
__decorate([
    IsString({ message: 'El nombre completo no ha sido ingresado' }),
    MinLength(7, {
        message: 'El nombre completo  es muy corto',
    }),
    MaxLength(100, {
        message: 'El nombre completo no puede superar los 100 caracteres',
    }),
    __metadata("design:type", String)
], CrearProfesorDto.prototype, "nombreCompleto", void 0);
__decorate([
    IsOptional(),
    IsNumberString({ message: 'El telefono no fue ingresado' }),
    MinLength(4, {
        message: 'El telefono debe contener al menos 4 caracteres',
    }),
    MaxLength(100, {
        message: 'El telefono debe contener 100 caracteres máximo',
    }),
    IsOptional(),
    __metadata("design:type", String)
], CrearProfesorDto.prototype, "telefono", void 0);
__decorate([
    IsNumberString(),
    MinLength(4, {
        message: 'El celular debe contener al menos 4 caracteres',
    }),
    MaxLength(100, {
        message: 'El celular debe contener 100 caracteres máximo',
    }),
    IsOptional(),
    __metadata("design:type", String)
], CrearProfesorDto.prototype, "celular", void 0);
__decorate([
    IsString(),
    MinLength(4, {
        message: 'El email debe contener al menos 4 caracteres',
    }),
    MaxLength(70, {
        message: 'El email debe contener 70 caracteres máximo',
    }),
    __metadata("design:type", String)
], CrearProfesorDto.prototype, "email", void 0);
__decorate([
    IsString({ message: 'La formación no ha sido ingresado' }),
    MinLength(7, {
        message: 'La formación es muy corto',
    }),
    MaxLength(100, {
        message: 'La formación no puede superar los 100 caracteres',
    }),
    __metadata("design:type", String)
], CrearProfesorDto.prototype, "formacion", void 0);
__decorate([
    IsString({ message: 'El titulo no ha sido ingresado' }),
    MinLength(7, {
        message: 'El titulo es muy corto',
    }),
    MaxLength(100, {
        message: 'El titulo no puede superar los 100 caracteres',
    }),
    __metadata("design:type", String)
], CrearProfesorDto.prototype, "titulo", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", Date)
], CrearProfesorDto.prototype, "fechaCreacion", void 0);
__decorate([
    IsDateString(),
    IsOptional(),
    __metadata("design:type", String)
], CrearProfesorDto.prototype, "fechaModificacion", void 0);
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], CrearProfesorDto.prototype, "activo", void 0);
export default CrearProfesorDto;
//# sourceMappingURL=profesor.dto.js.map