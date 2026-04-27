import {
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';
import { RolesEnum } from '../../common/enums/roles.enum';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @Length(3, 20)
  username: string;

  @IsString()
  @Length(8, 32)
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }
    return value as unknown;
  })
  @IsEnum(RolesEnum)
  rol?: RolesEnum;
}
