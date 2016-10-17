import { Observable, Subject } from 'rxjs';
import { Response, Http, Headers } from '@angular/http';

import { EurekaConfig } from './eureka-config';
import { EurekaState } from './eureka-state';
import { EurekaInstance } from './eureka-instance';
import { EurekaApp } from './eureka-app';

const EurekaWaitTimeout = 500;

export class Eureka<T, TA> {

    protected subjectInstanceFounded: Subject<EurekaInstance>
    = new Subject<EurekaInstance>();
    onInstance = this.subjectInstanceFounded.asObservable();

    private _instance: EurekaInstance;
    public get instance(): EurekaInstance {
        return this._instance;
    }
    private headers: Headers;
    private _state: EurekaState = EurekaState.DISABLED;
    public isWaiting() {
        return (this.state === EurekaState.CHECKING_INSTANCE)
            || (this.state === EurekaState.WAITING_FOR_INSTANCES);
    }
    public get state() {
        return this._state;
    }
    private app: EurekaApp;
    private http: Http;

    constructor(private config: EurekaConfig) {
        this.headers = new Headers();
        this.headers.append('Content-Type', 'application/json');
        this.headers.append('Accept', 'application/json');
    }

    private eurekaInstancesResolver(list: EurekaInstance[]) {

        if (list.length === 1) {
            this._instance = JSON.parse(JSON.stringify(list[0]));
        } else {
            let randomInstance = getRandomInt(0, list.length - 1)
            this._instance = JSON.parse(JSON.stringify(list[randomInstance]));
        }
        this.subjectInstanceFounded.next(this._instance);
        setTimeout(() => {
            this._state = EurekaState.ENABLE;
        });       

    }

    public discovery(http: Http) {
        this.onInstance.subscribe(() => {
            console.info('instance resolved !');
        });
        this.http = http;
        this._state = EurekaState.WAITING_FOR_INSTANCES;
        console.log('start JOURNE!!!')
        this.http.get(`${this.config.serviceUrl}/${this.config.decoderName}`,
            { headers: this.headers })
            .subscribe(r => {
                let data = r.json();
                let res: EurekaApp = data['application'];
                if (!res.instance || !res.instance.length || res.instance.length === 0) {
                    this._state = EurekaState.SERVER_ERROR;
                    console.error(`Eureka instaces not found on address: ${this.config.serviceUrl}/${this.config.decoderName} `);
                    return;
                }
                this.eurekaInstancesResolver(res.instance.filter(e => e.EurekaInstanceStatus === 'up'));
            }, () => {
                this._state = EurekaState.SERVER_ERROR;
                console.error(`Eureka server not available address: ${this.config.serviceUrl}/${this.config.decoderName} `);
                return;
            });
    }

}




/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}