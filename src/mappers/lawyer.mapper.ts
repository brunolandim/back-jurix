import { getPublicUrl, extractS3Key } from '../utils/s3';
import type { Lawyer, LawyerPublic } from '../types';

export class LawyerMapper {
  static build(lawyer: Lawyer): Lawyer {
    return {
      ...lawyer,
      photo: lawyer.photo ? getPublicUrl(extractS3Key(lawyer.photo)) : null,
    };
  }

  static toPublic(lawyer: Lawyer): LawyerPublic {
    const { passwordHash, ...publicData } = LawyerMapper.build(lawyer);
    return publicData;
  }

  static resolvePhoto(photo: string | null): string | null {
    return photo ? getPublicUrl(extractS3Key(photo)) : null;
  }
}
