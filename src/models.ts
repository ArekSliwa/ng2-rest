
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';
import { Log, Level } from 'ng2-logger';
import { RestHeaders } from "./rest-headers";
import { Rest } from "./rest.class";
import { Cookie } from "./cookie";
import { Mapping, encode, decode, initEntities } from './mapping';

const log = Log.create('rest namespace', Level.__NOTHING)

export type MetaRequest = { path: string, endpoint: string; entity: Mapping; }
export type HttpCode = 200 | 400 | 404 | 500;
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'JSONP';

export type PromiseObservableMix<T> = Promise<T> & { observable: Observable<T>; }

export type MethodWithoutBody<E, T, R =PromiseObservableMix<E>> = (params?: UrlParams[], doNotSerializeParams?: boolean) => R
export type MethodWithBody<E, T, R =PromiseObservableMix<E>> = (item?: T, params?: UrlParams[], doNotSerializeParams?: boolean) => R
export type ReplayData = { subject: Subject<any>, data: { url: string, body: string, headers: RestHeaders, isArray: boolean; }, id: number; };
export type ReqParams = { url: string, method: HttpMethod, headers?: RestHeaders, body?: any, jobid: number, isArray: boolean };

export interface ResourceModel<A, TA> {
    model: (pathModels?: Object, responseObjectType?: Function) => Rest<A, TA>,
    replay: (method: HttpMethod) => void;
}

export interface Ng2RestMethods<E, T> {
    get: MethodWithoutBody<E, T>;
    post: MethodWithBody<E, T>;
    put: MethodWithBody<E, T>;
    delete: MethodWithoutBody<E, T>;
    jsonp: MethodWithoutBody<E, T>;
}

export interface FnMethodsHttp<T, TA> extends Ng2RestMethods<HttpResponse<T>, T> {
    array: Ng2RestMethods<HttpResponse<TA>, TA>;
};

export interface NestedParams {
    [params: string]: string;
}

export interface UrlParams {
    [urlModelName: string]: string | number | boolean | RegExp | Object;
    regex?: RegExp;
}[];

export abstract class BaseBody {
    protected toJSON(data, isJSONArray = false) {
        let r = isJSONArray ? [] : {};
        if (typeof data === 'string') {
            try {
                r = JSON.parse(data);
            } catch { }
        } else if (typeof data === 'object') {
            return data;
        }
        return r as any;
    }
}

export class HttpBody<T> extends BaseBody {

    constructor(private body: string, private isArray = false, private entity: Mapping) {
        super();
    }
    public get json(): T {
        if (this.entity && typeof this.entity === 'object') {
            const json = this.toJSON(this.body, this.isArray);
            if (Array.isArray(json)) {
                const result = json.map(j => encode<T>(j, this.entity)) as any;
                return result;
            }
            return encode(json, this.entity) as any;
        }
        return this.toJSON(this.body, this.isArray);
    }
    public get text() {
        return this.body;
    }
}

export class ErrorBody extends BaseBody {
    constructor(private data) {
        super();
    }

    public get json(): Object {
        return this.toJSON(this.data);
    }
    public get text() {
        return this.data
    }
}


export abstract class BaseResponse<T> {
    protected static readonly cookies = Cookie.Instance;

    public get cookies() {
        return BaseResponse.cookies;
    }
    constructor(
        responseText?: string,
        public readonly headers?: RestHeaders,
        public readonly statusCode?: HttpCode | number,
        isArray = false
    ) {
    }
}

export class HttpResponse<T> extends BaseResponse<T> {
    public readonly body?: HttpBody<T>;
    // public readonly TOTAL_COUNT_HEADER = 'X-Total-Count'.toLowerCase();
    // public get totalElements(): number {
    //     return Number(this.headers.get(this.TOTAL_COUNT_HEADER));
    // }
    constructor(
        responseText?: string,
        headers?: RestHeaders,
        statusCode?: HttpCode | number,
        entity?: Mapping,
        isArray = false,
    ) {
        super(responseText, headers, statusCode, isArray);
        if (typeof entity === 'string') {
            const headerWithMapping = headers.get(entity);
            entity = JSON.parse(headers.getAll(entity).join());
        }
        this.body = new HttpBody(responseText, isArray, entity) as any;
    }
}

export class HttpResponseError extends BaseResponse<any> {
    private body: ErrorBody;
    // public tryRecconect() {

    // }
    constructor(
        public message: string,
        responseText?: string,
        headers?: RestHeaders,
        statusCode?: HttpCode | number
    ) {
        super(responseText, headers, statusCode);
        this.body = new ErrorBody(responseText)
    }
}

export interface MockResponse {
    data?: any;
    code?: HttpCode;
    error?: string;
    headers?: RestHeaders;
    jobid?: number;
    isArray: boolean;
}

