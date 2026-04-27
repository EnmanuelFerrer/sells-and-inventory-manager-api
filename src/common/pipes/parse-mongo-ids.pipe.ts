import {
  ArgumentMetadata,
  ConflictException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class ParseMongoIdsPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string' && isValidObjectId(value)) {
      return value;
    } else {
      const { type, data } = metadata;
      const capitalizedType = type.replace(/^./, (char) => char.toUpperCase());

      throw new ConflictException(
        `${capitalizedType} '${data}' must be a valid id`,
      );
    }
  }
}
