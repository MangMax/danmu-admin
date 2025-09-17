import { consola } from 'consola'

export default function () {
  return consola.create({
    formatOptions: {
      columns: 200
    }
  });
}