# Aria Scribe – API Client Generation & NestJS Stubs

This doc shows you **exact commands** to generate a typed browser/Node client from the **Public OpenAPI spec** *and* scaffolds the NestJS controllers/services that fulfil those endpoints.

> Directory assumptions
>
> ```text
> repo/
> ├── app/
> │   ├── backend/   # NestJS project (existing)
> │   └── frontend/  # Next.js project
> └── docs/api/aria-public.yaml  # OpenAPI file (created earlier)
> ```

---

## 1  Generate TypeScript API client (Axios‑based)

### 1.1  Install generator

```bash
npm i -D openapi-typescript-codegen axios
```

### 1.2  Run generator script

```bash
npx openapi-typescript-codegen \
  --input docs/api/aria-public.yaml \
  --output packages/api-client \
  --client axios \
  --name AriaApiClient
```

> **Result:** `packages/api-client` exports ES modules like `import { PatientsService } from '@aria/api-client';` complete with typed DTOs.

### 1.3  Use in Next.js front‑end

```ts
import { PatientsService, Configuration } from '@aria/api-client';

const config = new Configuration({ basePath: '/v1', accessToken });
const patients = await PatientsService.patientsGet({ limit: 20 }, config);
```

Add `packages/api-client` to your workspace root `package.json` under `"workspaces"` so both front‑ and back‑end can import it.

---

## 2  NestJS stub generation

### 2.1  Install Swagger module & generator helpers

```bash
cd app/backend
npm i @nestjs/swagger swagger-ui-express class-validator class-transformer
```

### 2.2  Controller stubs

Create `src/modules/auth/auth.controller.ts`:

```ts
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, TokenResponseDto } from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate clinician and receive JWTs' })
  @ApiResponse({ status: 200, type: TokenResponseDto })
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiResponse({ status: 200, type: TokenResponseDto })
  refresh() {
    return this.authService.refresh();
  }
}
```

`src/modules/patients/patients.controller.ts`:

```ts
import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';

@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  findAll(@Query('limit') limit = 50, @Query('offset') offset = 0) {
    return this.patientsService.findAll({ limit, offset });
  }

  @Post()
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}
```

> Repeat the same pattern for **ConsultationsController**, **NotesController**, **BillingController**.

### 2.3  DTO & validation example

`src/modules/patients/dto/create-patient.dto.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreatePatientDto {
  @ApiProperty() @IsString() first_name: string;
  @ApiProperty() @IsString() last_name: string;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() dob?: string;
  @ApiProperty({ required: false }) @IsOptional() medicare_no?: string;
}
```

### 2.4  Service skeleton (Patients)

`patients.service.ts`:

```ts
@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll({ limit, offset }) {
    return this.prisma.patient.findMany({ take: limit, skip: offset });
  }

  create(dto: CreatePatientDto) {
    return this.prisma.patient.create({ data: dto });
  }

  findOne(id: string) {
    return this.prisma.patient.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdatePatientDto) {
    return this.prisma.patient.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.patient.delete({ where: { id } });
  }
}
```

### 2.5  Module registration

`patients.module.ts`:

```ts
@Module({
  controllers: [PatientsController],
  providers: [PatientsService],
})
export class PatientsModule {}
```

Add to `AppModule` imports array.

---

## 3  Automate stub generation (optional)

For future spec changes, you can auto‑scaffold controllers using **nestjs-openapi-generator** (experimental) or a custom script that parses the YAML and outputs controller templates.

---

## 4  CI hooks

1. **Generate client** – run generator in `prebuild` hook so client code is always in sync.
2. **Compile backend** – `npm run test && npm run build` fails if DTOs mismatch.
3. **E2E test** – use generated `api-client` inside Jest tests to hit local NestJS server.

---

> **Next:** wire the NestJS services up to Prisma with RLS‑aware queries and plug in the Supabase Storage presigned‑URL flow for `/consultations/start`.

