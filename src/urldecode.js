// let jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
// let jwt = "eyJpc3MiOiJEaW5vQ2hpZXNhLmdpdGh1Yi5pbyIsInN1YiI6ImF1ZHJleSIsImF1ZCI6InRhbWFyYSIsImlhdCI6MTY2NTU3Nzc3OSwiZXhwIjoxNjY1NTc4Mzc5LCJ2ZXJzaW9uIjpbdHJ1ZSwiOG1tMnNsOWYwenRoZjI5b3hvY3J1biJdfQ";
let jwt = "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJEaW5vQ2hpZXNhLmdpdGh1Yi5pbyIsInN1YiI6ImF1ZHJleSIsImF1ZCI6InRhbWFyYSIsImlhdCI6MTY2NTU3Nzc3OSwiZXhwIjoxNjY1NTc4Mzc5LCJ2ZXJzaW9uIjpbdHJ1ZSwiOG1tMnNsOWYwenRoZjI5b3hvY3J1biJdfQ.iIPVV8qiyf6yFLDsEFqlWiu8mgRJg1ankZM25eXrUAicKKddQ9WgIC9AFKgNQD7L4T4tSwl3fF4u9XsFL0u97hr-4n2kmCMzjpWFr7WN9q4QLoWcuhdOa7PAkI87UMs17FgEp9r4xcIw7KTTPnC396OOjmeQdcFWEg8hAvj0gwHtaUfMc-LFnPeEiAattrtyIukNjXEf8vI6h7DqhpMtzKZRODVsoOZwaqcCHXxa_J-qiAhZXlpsizM17kvasfyQLvbeY94HSaoc7vk5NjKRkYyT6tmxVuiXHrKBGPLEbAWtetgtk2W144L2ZEkU6x14anbsFCLZvTNeD8ttPIr1kA";

function parseJwt (token) {
  const tokenDecodablePart = token.split('.')[1];
  const jsonPayload = Buffer.from(tokenDecodablePart, 'base64').toString(); 

  return JSON.parse(jsonPayload);
};

console.log(parseJwt(jwt));