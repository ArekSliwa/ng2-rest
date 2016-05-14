## ng2-rest ##

Multi-endpoint REST api with **Angular 2.** Alternative to angularjs $resource ;

Take advantage of ENUM in typescript and generic class and
define your **multiple endpoints url**. Playing with your REST
API was never so easy...



To install package run:

    npm install ng2-rest --save




Simple use:


    import { Resource } from 'ng2-rest/ng2-rest';
    
and class to your bootstrap:

    bootstrap(App, [
              SOME_APP_PROVIDERS, 
              Resource // our ng2-rest
           ]);

build your enum with endpoints ( you can also use strings, but enum's are better !) :
	
    enum ENDPOINTS { // enum instead of 
    	    API,
    	    OTHER_API
    	}


Define interfaces for response

    import { User, Book, Weather } from './models' // interface

Map your urls and models
   
     @Injectable()
        export class SampleServiceORComponent {
            constructor(private rest: Resource) {
            
	            // map endpoints and urls
	            this.rest.map(ENDPOINTS.API, 'http://localhost:/api');
				this.rest.map(ENDPOINTS.OTHER_API, 'http://example.com/api');
				
				// define your models
                rest.add<User>(ENDPOINTS.API, 'users'); 
                rest.add<Book>(ENDPOINTS.API, 'books'); 
                rest.add<Weather>(ENDPOINTS.OTHER_API, 'weather'); 
                
                }
              }
		
		giveMeSampleUsers() {
			// exacly the same as in angular 1.x $resource 
			// ex. get,query,save,update,remove
			this.rest.api(ENDPOINTS.API, 'users')
			 .query() // 
			 .subscribe((users) => {
	            console.log('users', users);
	        })
		}

before that you need to define your endpoints ENUM  (for now inside npm package - endpoints.enum.ts):

    export enum ENDPOINTS {
	    API,
	    OTHER_SUPER_API 
	}

and define endpoinsts url   (for now inside npm package - resource.service.ts): :

    this.endpoints[ENDPOINTS.API] = {
       url: 'http://localhost:3002/api/',
       models: {}
    };

Available methods:
- **query** ( fetch array of your models )
- **get** ( get model by id )
 - **save** ( post your model )
- **update** ( put model by id )
- **remove** ( delete model by id )
    
Additional methods ( in nearest future )
- **jsonp** ( get jsonp data )
    

