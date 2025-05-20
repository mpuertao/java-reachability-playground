import http, { head } from "k6/http";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { check } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

import faker from "https://cdnjs.cloudflare.com/ajax/libs/Faker/3.1.0/faker.min.js";


export const options = {
  // A number specifying the number of VUs to run concurrently.
  stages:[
    { duration: '10s', target: 100 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 0}
    // { duration: '10s', target: 15 },
    // { duration: '30s', target: 15 },
    // { duration: '10s', target: 20 },
    // { duration: '10s', target: 10 },
    // { duration: '30s', target: 10 },
    // { duration: '10s', target: 0 },
  ],
  // scenarios: {
  //   getBookings: {
  //     executor: "shared-iterations",
  //     exec: "getBookings",
  //     vus: 100,
  //     //iterations: 10,
  //   },
  //   createBooking: {
  //     executor: "shared-iterations",
  //     exec: "createBooking",
  //     vus: 100,
  //     //iterations: 10,
  //   },
  //   modifyBooking: {
  //     executor: "shared-iterations",
  //     exec: "modifyBooking",
  //     vus: 10,
  //     iterations: 10,
  //   },
  //   deleteBooking: {
  //     executor: "shared-iterations",
  //     exec: "deleteBooking",
  //     vus: 10,
  //     iterations: 10,
  //   },
  // }
};


let bookingIds = [];

export const dataInfo = () => ({
  firstname: faker.name.firstName(),
  lastname: faker.name.lastName(),
  totalprice: faker.random.number({ min: 100, max: 1000 }),
  depositpaid: faker.random.boolean(),
  bookingdates: {
    checkin: faker.date.recent(10),
    checkout: faker.date.future(10),
  },
  additionalneeds: faker.random.arrayElement(["Breakfast", "Lunch", "Dinner"]),
});

const url = "https://restful-booker.herokuapp.com/booking";
const params = {
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
};

// export function setup() {
//   const dataRequest = dataInfo();
//   const payload = JSON.stringify(dataRequest);
//   const res = http.post(url, payload, params);
//   check(res, {
//     "status is 200": (r) => r.status === 200,
//   });

//   const bookingid = res.json().bookingid;
//   console.log(`********** ID DE RESERVA ES = ----> ${bookingid} <---- ******************`);
//   return { bookingid };
// }


export default function getBookings() {
  const res = http.get(url, params);
  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  checkResult(res, res.status === 200);
  
}


export function createBooking() {

  const dataRequest = dataInfo();
  const payload = JSON.stringify(dataRequest);

  const res = http.post(url, payload, params);
  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  checkResult(res, res.status === 200);

  bookingsIds.push(res.json().bookingid);

}


export function modifyBooking() {

  const bookingid = bookingIds[bookingIds.length - 1];
  console.log(`********** ID DE RESERVA EN PUT ES = ----> ${bookingid} <---- ******************`);


  const user = JSON.stringify({
    username: "admin",
    password: "password123",
  });

  const auth = http.post('https://restful-booker.herokuapp.com/auth', user, params);
  const token = auth.json().token;
  //console.log(`***TOKEN GENERADO PARA LA AUTH*** => ${token}`);
  const dataRequest = dataInfo();
  const payload = JSON.stringify(dataRequest);


  const res = http.put(`${url}/${bookingid}`, payload, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Cookie": `token=${token}`}
  });
  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  checkResult(res, res.status === 200);
}

export function deleteBooking(data) {
  const bookingid = bookingIds.pop();
  console.log(`********** ID DE RESERVA EN DELETE ES = ----> ${bookingid} <---- ******************`);
  const res = http.del(`${url}/${bookingid}`, params);
  check(res, {
    "status is 201": (r) => r.status === 201,
  });
}


export function handleSummary(data) {
  return {
    "summary.html": htmlReport(data),
    "summary.json": JSON.stringify(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

function checkResult(res, status) {
  if (!status) {
    console.error(res);
  }
}
