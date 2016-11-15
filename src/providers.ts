import {Resource} from './resource.service';
import {MockController} from './mock.controller';
import {MockAutoBackend} from './mock-auto-backend.class';
import { JsonpModule } from '@angular/http';

export const NG2REST_PROVIDERS = [Resource, JsonpModule];
