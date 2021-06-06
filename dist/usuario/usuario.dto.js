var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { rolesEnum } from '../utils/roles.enum';
class UsuarioDto {
}
__decorate([
    IsString({ message: 'El email es requerido' }),
    __metadata("design:type", String)
], UsuarioDto.prototype, "email", void 0);
__decorate([
    IsString({ message: 'El password es requerido' }),
    __metadata("design:type", String)
], UsuarioDto.prototype, "password", void 0);
__decorate([
    IsString({ message: 'El nombre es requerido' }),
    __metadata("design:type", String)
], UsuarioDto.prototype, "nombre", void 0);
__decorate([
    IsString({ message: 'El apellido es requerido' }),
    __metadata("design:type", String)
], UsuarioDto.prototype, "apellido", void 0);
__decorate([
    IsOptional(),
    IsString({ message: 'El telefono es requerido' }),
    __metadata("design:type", String)
], UsuarioDto.prototype, "telefono", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UsuarioDto.prototype, "rol", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UsuarioDto.prototype, "identificacion", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UsuarioDto.prototype, "fechaNacimiento", void 0);
__decorate([
    IsBoolean(),
    IsOptional(),
    __metadata("design:type", Boolean)
], UsuarioDto.prototype, "perfilCompleto", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UsuarioDto.prototype, "observacion", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UsuarioDto.prototype, "totalGastado", void 0);
__decorate([
    IsNumber(),
    IsOptional(),
    __metadata("design:type", Number)
], UsuarioDto.prototype, "ultimaCompra", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UsuarioDto.prototype, "tarjetaGuardada", void 0);
__decorate([
    IsOptional(),
    IsDateString({ message: 'La fecha de creacion tiene que ser un string' }),
    __metadata("design:type", String)
], UsuarioDto.prototype, "fechaCreacion", void 0);
__decorate([
    IsOptional(),
    IsString({ message: 'El id del usuario creador tiene que ser un string' }),
    __metadata("design:type", String)
], UsuarioDto.prototype, "usuarioCreacion", void 0);
__decorate([
    IsDateString({ message: 'La fecha de modificacion tiene que ser un string' }),
    IsOptional(),
    __metadata("design:type", String)
], UsuarioDto.prototype, "fechaModificacion", void 0);
__decorate([
    IsString({ message: 'El id del usuario modificador tiene que ser un string' }),
    IsOptional(),
    __metadata("design:type", String)
], UsuarioDto.prototype, "usuarioModificacion", void 0);
__decorate([
    IsBoolean({ message: 'Activo debe ser un booleano' }),
    __metadata("design:type", Boolean)
], UsuarioDto.prototype, "activo", void 0);
export default UsuarioDto;
//# sourceMappingURL=usuario.dto.js.map