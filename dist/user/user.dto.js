var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import CreateAddressDto from './address.dto';
class CreateUserDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "firstName", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "lastName", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    IsOptional(),
    ValidateNested(),
    __metadata("design:type", CreateAddressDto)
], CreateUserDto.prototype, "address", void 0);
export default CreateUserDto;
//# sourceMappingURL=user.dto.js.map