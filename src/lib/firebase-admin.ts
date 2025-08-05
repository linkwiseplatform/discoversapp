import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

const serviceAccount: ServiceAccount = {
  "projectId": "discoversapp",
  "privateKey": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCx5wkFpmhLcf6s\n4Y/tcPu21JGVcD+ur2zBKuHo1EKW0aGLhWwAsV3Pp4t7/o7hyBssgWkiybwxHT6i\n9mIkybzIBaP6eNppnDb4eECpw6x6SQnEmY0ao81nCjtc3hoptKT2KZzhEFs6vjtV\nlk6wv1j2JXg+wtjhCOdyh793d6DoHQ7Z1ruJlw8xYwRzXz4FcPzKoDbX1IOjZrOk\ni+jc5AQnKXAx+YikZNqe46anuMSGII4+W4wc+as/TsCYodHnq1d3rrgqZDXnuVUD\nseRSc/grO6NyXy4bQ9yJAeLK+5MqSEh5pdPUZHE0I04kZb8iSAeasWM7zbkmTxVt\nWl+S9VrNAgMBAAECggEAGYWlm7Pl3nz6Jl8twMims/IG+MNjv3HXTlcSlc5txylH\n3bZEak0HwlStBBre8LE+hMIEDUOXxgwGAmcKaXCvrppwjexsmR4aHMdTr4cs5VY5\nGoVU4u+A9jlXjtkmM7mAuPf7U6Z/EAxegsbPfzfUUWvKtmZJqu8WFS44X7E/2kyi\n/Gz/kYOFab4Pp5LpDN86Hmoph3gQJrxvGk0alrvVS9Rudt0W20b2/Hn56b74TA67\nDYanIu/eV5zRRjD+8bOenfRW9V6JG+q3lXDheLiXZ+JeknvA7WUAWRv/ygmcXJNf\nNe5gaWbvCtFBcYn99NMOAI+rAsVEUUE9BgMDizaCmQKBgQD3wQARPJ6fPZhovpUM\nKssZa9ghCK2XvvK0c1ZRNKVgdRueaqhYBN5LFBI6P/yAy5k4DIAIEtbA382eheAq\ns3CtPpsFygDRwtchVx66LkGnxdivQxlZIHjy+5rjUe8xS7JAQvyPrgK8vS6NQ3Fk\n4JBcMZLYQzBMUoxnGbGUOhex5wKBgQC30tzDt8jRLV3EH3RopKyPMLQn2CYBi1iq\nAJL2COS7Hvlx2G27lg4Yg/wbU7nQFunRei8ItPBmRpYTH+11rx9Dv1cyrxd3PvkW\nUVj68D5KgHUhQFz99EKBe6PbGEumXuSQbZ55eAefLdAY29nYktSCTnHRiOrHNfUn\nkT+moySfKwKBgQDsFXts8WjtsRI0bbc1uumCNePjxpM0kH5SOb287//O5IkG8fes\nuCbjQCMGYsbILDq60B6IkvsVG66iKkwsJIVwcMHkSFNzjsjVOmFLZJyntL4AdF4J\nMgpO8Dbt+ruFK+6Vkb99YoG1PEjJz8SULfEiCRM3BP9XGyozbKZs6tZ9bQKBgGhW\nCPQVxqfjxgrhh6M1hLQpgrfy2W+a9hJYDRIU7i6/X/ocS/xjKVEE6P1hwl+4AbLi\nVPvuJ10Fx3zHbHKVmXtMiWO9OeZ3Gc5vEcAsyE5lJxZef+ms0GrKELD000t1JOpN\nLdvoIvtYd3sEnltsy63CdJvnyMqVd7ajnKsqgkjNAoGAKf1+RMiVR14ife7lloaJ\nlM4soLQezRpnjAEdlXFTkvlplt2FJovzwg6D674iM5vppThmiiY6tQVVQT7PrDcC\n204jJSpYE8GpnzT56H1M2w5Z9GZfdwVb7M7N8bZtgnJHkW8qHokcJ7NTCUgRWXbe\nQ178DrEGsFmIb6g23eunrus=\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
  "clientEmail": "firebase-adminsdk-fbsvc@discoversapp.iam.gserviceaccount.com",
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://discoversapp-default-rtdb.asia-southeast1.firebasedatabase.app"
  });
}

const adminAuth = admin.auth();
const adminDb = admin.database();

export { adminAuth, adminDb };
