//#region import
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';
import { Log, Level } from 'ng2-logger';
const log = Log.create('rest.class', Level.__NOTHING)
import * as JSON5 from 'json5';
// local
import { HttpMethod, HttpResponse, HttpResponseArray, FnMethodsHttp, UrlParams, Ng2RestMethods } from './models';
import { getRestParams, getParamsUrl } from "./params";
import { RestRequest } from "./rest-request";
import { RestHeaders } from "./rest-headers";
//#endregion

export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

export class Rest<T, TA = T[]> implements FnMethodsHttp<T, TA> {

    //#region  private fields
    public static headers: RestHeaders = new RestHeaders();
    public static headersResponse: RestHeaders = new RestHeaders();

    private __meta_endpoint: string;
    private _endpointRest: string;
    private get endpoint() {
        let e = this.__meta_endpoint;
        if (this.restQueryParams !== undefined && this._endpointRest !== undefined
            && typeof this._endpointRest === 'string' && this._endpointRest.trim() !== '') e = this._endpointRest;
        return e;
    }
    private restQueryParams: Object;
    public set __rest_endpoint(endpoint) {
        this._endpointRest = endpoint;
        if (endpoint === undefined) {
            this.restQueryParams = undefined;
        } else {
            this.restQueryParams = getRestParams(endpoint, this.__meta_endpoint);
        }

    }

    private static _headersAreSet: boolean = false;


    private getHeadersJSON() {
        return Rest.headers.toJSON();
    }

    private creatUrl(params: any, doNotSerializeParams: boolean = false) {
        return `${this.endpoint}${getParamsUrl(params, doNotSerializeParams)}`;
    }

    //#endregion

    //#region  constructor
    constructor(
        endpoint: string,
        private request: RestRequest,
        private meta: { path: string, endpoint: string; }
    ) {
        this.__meta_endpoint = endpoint;

        if (!Rest._headersAreSet) {
            Rest._headersAreSet = true;
            for (let h in DEFAULT_HEADERS) {
                Rest.headers.append(h, DEFAULT_HEADERS[h]);
            }
        }

    }
    //#endregion

    //#region  req
    private req(method: HttpMethod,
        item: T,
        params?: UrlParams[],
        doNotSerializeParams: boolean = false,
        isArray: boolean = false
    ) {

        const modelUrl = this.creatUrl(params, doNotSerializeParams);
        const body = item ? JSON.stringify(item) : undefined;
        for (let h in DEFAULT_HEADERS) {
            Rest.headers.set(h, DEFAULT_HEADERS[h]);
        }
        return this.request[method.toLowerCase()](modelUrl, body, Rest.headers, this.meta, isArray);
    }
    //#endregion

    //#region http methods

    //#region replay
    replay(method: HttpMethod) {
        this.request.replay(method, this.meta);
    }
    //#endregion

    array = {
        get: (params: UrlParams[] = undefined, doNotSerializeParams?: boolean): Observable<HttpResponseArray<TA>> => {
            return this.req('GET', undefined, params, doNotSerializeParams, true) as any
        },
        post: (item: TA, params?: UrlParams[], doNotSerializeParams?: boolean): Observable<HttpResponseArray<TA>> => {
            return this.req('POST', item as any, params, doNotSerializeParams, true) as any;
        },
        put: (item: TA, params?: UrlParams[], doNotSerializeParams?: boolean): Observable<HttpResponseArray<TA>> => {
            return this.req('PUT', item as any, params, doNotSerializeParams, true) as any;
        },
        delete: (params?: UrlParams[], doNotSerializeParams?: boolean): Observable<HttpResponseArray<TA>> => {
            return this.req('DELETE', undefined, params, doNotSerializeParams, true) as any;
        },
        jsonp: (params?: UrlParams[], doNotSerializeParams?: boolean): Observable<HttpResponseArray<TA>> => {
            return this.req('JSONP', undefined, params, doNotSerializeParams, true) as any;
        }
    }

    get(params?: UrlParams[], doNotSerializeParams: boolean = false): Observable<HttpResponse<T>> {
        return this.req('GET', undefined, params, doNotSerializeParams) as any;
    }

    post(item: T, params?: UrlParams[], doNotSerializeParams: boolean = false): Observable<HttpResponse<T>> {
        return this.req('POST', item, params, doNotSerializeParams);
    }

    put(item: T, params?: UrlParams[], doNotSerializeParams: boolean = false): Observable<HttpResponse<T>> {
        return this.req('PUT', item, params, doNotSerializeParams);
    }

    delete(params?: UrlParams[], doNotSerializeParams: boolean = false): Observable<HttpResponse<T>> {
        return this.req('DELETE', undefined, params, doNotSerializeParams);
    }

    jsonp(params?: UrlParams[], doNotSerializeParams: boolean = false): Observable<HttpResponse<T>> {
        return this.req('JSONP', undefined, params, doNotSerializeParams);
    }
    //#endregion

}

