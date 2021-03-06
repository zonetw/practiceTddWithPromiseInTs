import {PromiseStatus} from "./PromiseStatus";

type FulfilledAction = (result?)=>any;
type FailedAction = (reason?)=>any;

export class Promise{
    get status(): PromiseStatus {
        return this._status;
    }
    get value(): any {
        return this._value;
    }
    get id(): number {
        return this._id;
    }
    private static _promiseArr: Promise[] = [];
    private _status: PromiseStatus;
    private _value: any;
    private _id: number;
    private _onFulfilledActions: FulfilledAction[];
    private _onFailedActions: FailedAction[];

    constructor(executor?: (resolve:(result?)=>void, reject:(reason?)=>void)=>void){
        Promise._promiseArr.push(this);
        this._id = Promise._promiseArr.length;

        this._status = PromiseStatus.PENDING;
        this._value = undefined;
        this._onFulfilledActions = [];
        this._onFailedActions = [];
        this._resolve = this._resolve.bind(this);
        this._reject = this._reject.bind(this);

        if(executor){
            try{
                executor(this._resolve, this._reject);
            }catch(e){
                this._reject(e);
            }
        }
    }

    private _resolve(result?: any){
        if(this._status === PromiseStatus.PENDING){
            this._status = PromiseStatus.RESOLVED;
            this._value = result;

            // onFulfilled and onRejected must be called as functions (i.e. with no this value).
            this._onFulfilledActions.forEach((action: Function)=>{
                action(this._value);
            });
        }
    }

    private _reject(reason?: any){
        if(this._status === PromiseStatus.PENDING){
            this._status = PromiseStatus.REJECTED;
            this._value = reason;

            // onFulfilled and onRejected must be called as functions (i.e. with no this value).
            this._onFailedActions.forEach((action: Function)=>{
                action(this._value);
            });
        }
    }

    // A promise’s then method accepts two arguments: onFulfilled and onRejected
    // Both onFulfilled and onRejected are optional arguments:
    then(onFulfilled?: FulfilledAction, onRejected?:FailedAction): Promise{
        const promise = new Promise();

        const wrappedFulfilledAction = (result)=>{
            try{
                let output;
                if(onFulfilled) {
                    output = onFulfilled(result);
                }else{
                    output = result;
                }
                promise._resolve(output);
            }catch(e){
                promise._reject(e);
            }
        };
        switch(this.status){
            case PromiseStatus.PENDING:
                this._onFulfilledActions.push(wrappedFulfilledAction);
                break;
            case PromiseStatus.RESOLVED:
                // onFulfilled and onRejected must be called as functions (i.e. with no this value).
                wrappedFulfilledAction(this.value);
                break;
        }

        const wrappedFailedAction = (reason)=>{
            try{
                let output;
                if(onRejected){
                    output =  onRejected(reason);
                }else {
                    output = reason;
                }
                promise._reject(output);
            }catch(e){
                promise._reject(e);
            }
        };
        switch(this._status){
            case PromiseStatus.PENDING:
                this._onFailedActions.push(wrappedFailedAction);
                break;
            case PromiseStatus.REJECTED:
                // onFulfilled and onRejected must be called as functions (i.e. with no this value).
                wrappedFailedAction(this.value);
                break;
        }

        return promise;
    }
}