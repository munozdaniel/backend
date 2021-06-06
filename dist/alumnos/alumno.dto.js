var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, ValidateNested, IsOptional, IsBoolean, IsNumber, IsDateString, MaxLength, MinLength, IsArray, } from 'class-validator';
class CrearAlumnoDto {
}
__decorate([
    IsOptional(),
    IsString({ message: 'El legajo no ha sido ingresado' }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "legajo", void 0);
__decorate([
    IsString({ message: 'El dni no ha sido ingresado' }),
    MinLength(7, {
        message: 'El dni es muy corto',
    }),
    MaxLength(9, {
        message: 'El dni no puede superar los 9 digitos',
    }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "dni", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "_id", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "observacionTelefono", void 0);
__decorate([
    IsString(),
    IsOptional(),
    MinLength(4, {
        message: 'La observación es muy corta',
    }),
    MaxLength(200, {
        message: 'La observación no puede superar los 200 digitos',
    }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "observacion", void 0);
__decorate([
    ValidateNested(),
    IsArray({
        message: 'Debe ingresar al menos un elemento en la lista de adultos',
    }),
    __metadata("design:type", Array)
], CrearAlumnoDto.prototype, "adultos", void 0);
__decorate([
    IsString(),
    MinLength(3, {
        message: 'El tipo Dni es muy corto',
    }),
    MaxLength(9, {
        message: 'El tipo Dni no puede superar los 9 digitos',
    }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "tipoDni", void 0);
__decorate([
    IsString(),
    MinLength(3, {
        message: 'El nombre es muy corto',
    }),
    MaxLength(250, {
        message: 'El nombre no puede superar los 250 caracteres',
    }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "nombreCompleto", void 0);
__decorate([
    IsDateString({ message: 'La fecha de nacimiento no es válida' }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "fechaNacimiento", void 0);
__decorate([
    IsString(),
    MinLength(4, {
        message: 'El sexo debe indentificarse con más de 4 caracteres',
    }),
    MaxLength(15, {
        message: 'El sexo debe identificarse en 15 caracteres máximo',
    }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "sexo", void 0);
__decorate([
    IsString(),
    MinLength(4, {
        message: 'La nacionalidad debe contener al menos 4 caracteres',
    }),
    MaxLength(50, {
        message: 'La nacionalidad debe contener 50 caracteres máximo',
    }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "nacionalidad", void 0);
__decorate([
    IsOptional(),
    IsString({ message: 'El telefono no fue ingresado' }),
    MinLength(4, {
        message: 'El telefono debe contener al menos 4 caracteres',
    }),
    MaxLength(50, {
        message: 'El telefono debe contener 50 caracteres máximo',
    }),
    IsOptional(),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "telefono", void 0);
__decorate([
    IsString(),
    MinLength(4, {
        message: 'El celular debe contener al menos 4 caracteres',
    }),
    MaxLength(50, {
        message: 'El celular debe contener 50 caracteres máximo',
    }),
    IsOptional(),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "celular", void 0);
__decorate([
    IsString(),
    MinLength(4, {
        message: 'El email debe contener al menos 4 caracteres',
    }),
    MaxLength(70, {
        message: 'El email debe contener 70 caracteres máximo',
    }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "email", void 0);
__decorate([
    IsDateString({ message: 'La fecha de ingreso no es válida' }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "fechaIngreso", void 0);
__decorate([
    IsString(),
    MinLength(4, {
        message: 'La procedencia del colegio primario al menos 4 caracteres',
    }),
    MaxLength(50, {
        message: 'La procedencia del colegio primario debe contener 50 caracteres máximo',
    }),
    IsOptional(),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "procedenciaColegioPrimario", void 0);
__decorate([
    IsString(),
    MinLength(4, {
        message: 'La procedencia del colegio secundario debe contener al menos 4 caracteres',
    }),
    MaxLength(50, {
        message: 'La procedencia del colegio secundario debe contener 50 caracteres máximo',
    }),
    IsOptional(),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "procedenciaColegioSecundario", void 0);
__decorate([
    IsOptional(),
    IsDateString({ message: 'La fecha de baja no es válida' }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "fechaDeBaja", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MinLength(4, {
        message: 'El motivo de baja debe contener al menos 4 caracteres',
    }),
    MaxLength(50, {
        message: 'El motivo de baja debe contener 50 caracteres máximo',
    }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "motivoDeBaja", void 0);
__decorate([
    IsString(),
    MinLength(4, {
        message: 'El domicilio debe contener al menos 4 caracteres',
    }),
    MaxLength(100, {
        message: 'El domicilio  debe contener 100 caracteres máximo',
    }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "domicilio", void 0);
__decorate([
    IsNumber({ allowNaN: false }, {
        message: 'La cantidad de integrantes del grupo familiar debe ser numerico',
    }),
    IsOptional(),
    __metadata("design:type", Number)
], CrearAlumnoDto.prototype, "cantidadIntegranteGrupoFamiliar", void 0);
__decorate([
    IsString(),
    MinLength(2, {
        message: 'Seguimiento Etap de 2 caracteres',
    }),
    MaxLength(2, {
        message: 'Seguimiento Etap de 2 caracteres',
    }),
    IsOptional(),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "seguimientoEtap", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MinLength(4, {
        message: 'El nombre del TAE debe contener al menos 4 caracteres',
    }),
    MaxLength(100, {
        message: 'El nombre del TAE debe contener 100 caracteres máximo. ',
    }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "nombreCompletoTae", void 0);
__decorate([
    IsString({ message: 'El email del TAE no ha sido ingresado' }),
    IsOptional(),
    MinLength(4, {
        message: 'El email del TAE debe contener al menos 4 caracteres. ',
    }),
    MaxLength(70, {
        message: 'El email del TAE debe contener 70 caracteres máximo. ',
    }),
    __metadata("design:type", String)
], CrearAlumnoDto.prototype, "emailTae", void 0);
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
//# sourceMappingURL=alumno.dto.js.map