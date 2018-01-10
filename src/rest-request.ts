declare var require: any;

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';

import {
    HttpMethod, HttpCode, HttpResponse, HttpResponseError,
    MockRequest, MockResponse, ReqParams, ReplayData
} from "./models";
import { RestHeaders } from "./rest-headers";
import { Mapping, encode } from './mapping';
import { MetaRequest } from "./models";
import { isBrowser, isNode } from "ng2-logger";
import axios from 'axios';

const jobIDkey = 'jobID'

//#region mock request
//#endregion

export class RestRequest {

    public static zone;
    private static jobId = 0;
    private subjectInuUse: { [id: number]: Subject<any> } = {};
    private meta: { [id: number]: MetaRequest } = {};

    private handlerResult(res: MockResponse, method: HttpMethod, jobid?: number, isArray?: boolean) {
        if (isBrowser) {
            res.headers = new RestHeaders(res.headers, true);
        }

        // error no internet
        if (res && res.error) {
            this.subjectInuUse[jobid].error(new HttpResponseError(res.error, undefined, res.code))
            return;
        }
        const entity = this.meta[jobid].entity;

        // jsonp - no http code case
        if (res && !res.code) {
            this.subjectInuUse[jobid].next(
                new HttpResponse(res.data, res.headers, res.code, entity, isArray)
            )
            return;
        }

        // normal request case
        if (res && res.code >= 200 && res.code < 300 && !res.error) {
            this.subjectInuUse[jobid].next(
                new HttpResponse(res.data, res.headers, res.code, entity, isArray)
            )
            return;
        }

        // normal error
        this.subjectInuUse[jobid].error(new HttpResponseError(res.data, res.headers, res.code))
    }


    private async req(url: string, method: HttpMethod, headers?: RestHeaders, body?: any, jobid?: number, isArray = false) {
        try {
            const response = await axios({
                url,
                method,
                data: body,
                responseType: 'text',
                headers: headers.toJSON()
            })
            this.handlerResult({
                code: response.status as any,
                data: JSON.stringify(response.data),
                isArray,
                jobid,
                headers: new RestHeaders(response.headers)
            }, method, jobid, isArray);
        } catch (error) {
            this.handlerResult({
                code: error.status as any,
                error: error.message,
                isArray,
                jobid,
                headers: new RestHeaders(error.headers)
            }, method, jobid, isArray);
        }
    }

    private request(url: string, method: HttpMethod, headers?: RestHeaders, body?: any, isArray = false): MockResponse {
        var representationOfDesiredState = body;
        var client = new XMLHttpRequest();

        client.addEventListener
        client.open(method, url, false);
        client.send(representationOfDesiredState);

        return {
            data: client.responseText,
            error: client.statusText,
            code: <HttpCode>client.status,
            headers: RestHeaders.fromResponseHeaderString(client.getAllResponseHeaders()),
            isArray
        };

    }


    private getSubject(method: HttpMethod, meta: MetaRequest): ReplayData {
        if (!this.replaySubjects[meta.endpoint]) this.replaySubjects[meta.endpoint] = {};
        if (!this.replaySubjects[meta.endpoint][meta.path]) this.replaySubjects[meta.endpoint][meta.path] = {};
        if (!this.replaySubjects[meta.endpoint][meta.path][method]) {
            this.replaySubjects[meta.endpoint][meta.path][method] = <ReplayData>{
                subject: new Subject(),
                data: undefined,
            };
        }
        const replay: ReplayData = this.replaySubjects[meta.endpoint][meta.path][method];

        const id: number = RestRequest.jobId++;
        replay.id = id;

        const subject: Subject<any> = replay.subject;
        subject[jobIDkey] = id;

        this.meta[id] = meta;
        this.subjectInuUse[id] = subject;
        return replay;
    }


    //#region http methods

    private metaReq(method: HttpMethod, url: string, body: string, headers: RestHeaders, meta: MetaRequest, isArray: boolean): Observable<any> {
        const replay: ReplayData = this.getSubject(method, meta);
        replay.data = { url, body, headers, isArray };
        setTimeout(() => this.req(url, method, headers, body, replay.id, isArray))
        if (method.toLowerCase() === 'GET'.toLowerCase() && isBrowser) {
            return replay.subject.asObservable();
        }
        return replay.subject.asObservable().take(1).toPromise() as any;
    }

    get(url: string, body: string, headers: RestHeaders, meta: MetaRequest, isArray: boolean): Observable<any> {
        return this.metaReq('GET', url, body, headers, meta, isArray);
    }

    delete(url: string, body: string, headers: RestHeaders, meta: MetaRequest, isArray: boolean): Observable<any> {
        return this.metaReq('DELETE', url, body, headers, meta, isArray);
    }

    post(url: string, body: string, headers: RestHeaders, meta: MetaRequest, isArray: boolean): Observable<any> {
        return this.metaReq('POST', url, body, headers, meta, isArray);
    }

    put(url: string, body: string, headers: RestHeaders, meta: MetaRequest, isArray: boolean): Observable<any> {
        return this.metaReq('PUT', url, body, headers, meta, isArray);
    }

    jsonp(url: string, body: string, headers: RestHeaders, meta: MetaRequest, isArray: boolean): Observable<any> {
        const replay: ReplayData = this.getSubject('JSONP', meta);
        setTimeout(() => {
            if (url.endsWith('/')) url = url.slice(0, url.length - 1)
            let num = Math.round(10000 * Math.random());
            let callbackMethodName = "cb_" + num;
            window[callbackMethodName] = (data) => {
                this.handlerResult({
                    data, isArray
                }, 'JSONP', replay.id, isArray)
            }
            let sc = document.createElement('script');
            sc.src = `${url}?callback=${callbackMethodName}`;
            document.body.appendChild(sc);
            document.body.removeChild(sc);
        })
        return replay.subject.asObservable();
    }
    //#endregion
    private replaySubjects = {};
    public replay(method: HttpMethod, meta: MetaRequest) {
        const replay: ReplayData = this.getSubject(method, meta);
        if (!replay.data) {
            console.warn(`Canno replay first ${method} request from ${meta.endpoint}/${meta.path}`);
            return;
        };
        if (replay && replay.subject && Array.isArray(replay.subject.observers) &&
            replay.subject.observers.length == 0) {
            console.warn(`No observators for ${method} request from ${meta.endpoint}/${meta.path}`);
            return;
        }
        const url = replay.data.url;
        const headers = replay.data.headers;
        const body = replay.data.body;
        const isArray = replay.data.isArray;
        setTimeout(() => this.req(url, method, headers, body, replay.id, isArray))
    }

}
