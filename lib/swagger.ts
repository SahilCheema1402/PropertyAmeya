import { createSwaggerSpec } from 'next-swagger-doc';
import {leadFieldSchemaSwagger, userSchemaSwagger, leadSchemaSwagger,inventortSchemaSwagger,inventoryFieldSchemaSwagger} from './../app/_utils/swaggerSchema';
import 'server-only';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: process.env.SWAGGER_API_DOC_PATH,
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Ameya Innovex CRM Software',
        version: '1.0',
      },
      components: {
        schemas: {
          User: userSchemaSwagger,
          leadField: leadFieldSchemaSwagger,
          lead: leadSchemaSwagger,
          inventory:inventortSchemaSwagger,
          inventoryField:inventoryFieldSchemaSwagger
        },
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          }
        },
      },
      security: [
        {
          BearerAuth: [],
        }
      ],
    },
  });
  return spec;
};