import { Http, Response, Headers } from '@angular/http';

import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';

export class Rest<T, TA> {

    private headers: Headers;


    constructor(private endpoint: string, private http: Http) {
        this.headers = new Headers();
        this.headers.append('Content-Type', 'application/json');
        this.headers.append('Accept', 'application/json');
    }

    public query = (params: any = undefined): Observable<any> => {
        if (params !== undefined) {
            if (typeof params === 'object') params = JSON.stringify(params);
            params = encodeURI(params);
            return this.http.get(this.endpoint + '/' + params).map(res => res.json());
        }
        return this.http.get(this.endpoint).map(res => res.json());
    }

    public get = (id: any): Observable<any> => {
        if (typeof id === 'object') {
            id = JSON.stringify(id);
            id = encodeURI(id);
        }        
        return this.http.get(this.endpoint + '/' + id).map(res => res.json());
    }

    public save = (item: T): Observable<any> => {
        let toAdd = JSON.stringify(item);

        return this.http.post(this.endpoint, toAdd,
            { headers: this.headers }).map(res => res.json());
    }

    public update = (id: any, itemToUpdate: T): Observable<any> => {
        return this.http.put(this.endpoint + '/' + id, JSON.stringify(itemToUpdate),
            { headers: this.headers }).map(res => res.json());
    }

    public remove = (id: any): Observable<any> => {
        return this.http.delete(this.endpoint + '/' + id,
            { headers: this.headers }).map(res => res.json());
    }

}

