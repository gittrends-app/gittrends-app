import { z } from 'zod';
import { errorMap } from 'zod-validation-error';

z.setErrorMap(errorMap);
