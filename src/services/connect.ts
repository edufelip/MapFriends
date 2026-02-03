import connectSeed from '../mocks/connect.json';
import { Person } from './types';

const people = connectSeed.people as Person[];

export function getPeople() {
  return people;
}
