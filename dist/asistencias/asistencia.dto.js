var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsOptional, IsBoolean, IsDateString, ValidateNested } from 'class-validator';
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
    IsDateString(),
    __metadata("design:type", Date)
], CrearAsistenciaDto.prototype, "fecha", void 0);
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], CrearAsistenciaDto.prototype, "presente", void 0);
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], CrearAsistenciaDto.prototype, "llegoTarde", void 0);
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
//# sourceMappingURL=asistencia.dto.js.map