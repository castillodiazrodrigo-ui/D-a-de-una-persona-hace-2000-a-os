// Registro de escenarios (construcción perezosa, una sola vez)
import { build as bedroom } from './bedroom.js';
import { build as city } from './city.js';
import { build as sundial } from './sundial.js';
import { build as insula } from './insula.js';
import { build as street } from './street.js';
import { buildWorkshop as workshop, buildPort as port } from './work.js';
import { buildBathsExt as bathsExt, buildBathsInt as bathsInt } from './baths.js';
const BUILDERS = { bedroom, city, sundial, insula, street, workshop, port, bathsExt, bathsInt };
const cache = {};
export function getSet(name) { if (!cache[name]) cache[name] = BUILDERS[name](); return cache[name]; }
