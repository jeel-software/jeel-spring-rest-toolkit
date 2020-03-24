import { Attribute } from "./attribute";
import * as faker from 'faker';


export default function generateFake(attribute: Attribute):string {
    const intTypes =  ['Long', 'Integer', 'long', 'int'];
    const stringTypes = ['String']
    const dateTypes = ['Calendar', 'Date']

    if(intTypes.indexOf(attribute.type) >= 0){
        return   faker.random.number(999).toString();
    }

    if(stringTypes.indexOf(attribute.type) >= 0){
        return faker.lorem.words(5)
    }

    if(dateTypes.indexOf(attribute.type) >= 0){
        return '2018-01-01'//faker.date.recent().toString()
    }

    return faker.lorem.words(5)
}

