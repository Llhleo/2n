// Sites accepts designated output roots. Copy only the experiment; never use stable dist.
import {cp,mkdir} from 'node:fs/promises';
const output=new URL('../../out/',import.meta.url);
await mkdir(output,{recursive:true});
await cp(new URL('./public/',import.meta.url),output,{recursive:true});
