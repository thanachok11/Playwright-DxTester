import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

const apiUrl = process.env.API_URL;
const Username = process.env.USERNAME2 || 'dtest';
const password = process.env.PASSWORD || '1';

test.describe('Authentication API Test', () => {
    let token = '';

    const injectionPayloads = [
        `' OR '1'='1`,
        `" OR "1"="1`,
        `' OR 1=1--`,
        `" OR 1=1--`,
        `' OR 'x'='x`,
        `' OR 1=1#`,
        `admin' --`,
        `' OR 'a'='a`,
        `' OR '' = '`
    ];

    test('Login with valid credentials', async ({ request }) => {
        const response = await request.post(`${apiUrl}IsValidUser`, {
            data: {
                "param": {
                    "ContextKey": "ReU",
                    "ComputerLocationName": "com1",
                    "user": Username,
                    "password": password,
                    "RequireMenuAccessGroup": true
                }
            }
        });
        
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.AuthenUser).toBe("True");
        expect(body).toHaveProperty('TokenUserID');
        token = body.TokenUserID;
    });

    test('Login with invalid credentials', async ({ request }) => {
        const response = await request.post(`${apiUrl}IsValidUser`, {
            data: {
                "param": {
                    "ContextKey": "ReU",
                    "ComputerLocationName": "com1",
                    "user": Username,
                    "password": "wrongpassword",
                    "RequireMenuAccessGroup": true
                }
            }
        });
        
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.AuthenUser).toBe("False");
        expect(body.TokenUserID).toBe("");
    });

    test('Use TokenID in another request', async ({ request }) => {
        // Ensure we have a token (run login first or use a hardcoded one if needed)
        // Since we are using workers=1, we can rely on order if needed, 
        // but better to login within the test if they are independent.
        
        // Login first to get token
        const loginResponse = await request.post(`${apiUrl}IsValidUser`, {
            data: {
                "param": {
                    "ContextKey": "ReU",
                    "ComputerLocationName": "com1",
                    "user": Username,
                    "password": password,
                    "RequireMenuAccessGroup": true
                }
            }
        });
        const loginBody = await loginResponse.json();
        const currentToken = loginBody.TokenUserID;

        const response = await request.post(`${apiUrl}PublicAuthen`, {
            data: {
                "param": {
                    "RequireMenuAccessGroup": true,
                    "RequireDFDoctor": false,
                    "RequireMenuDocumentDept": false,
                    "passwordDecrypt": true,
                    "ContextKey": "ReU",
                    "user": Username,
                    "password": "",
                    "McAddress": "",
                    "ComputerLocationName": "com1",
                    "TokenID": currentToken,
                    "Latitude": "",
                    "Longitude": "",
                    "OSType": "",
                    "Memo": "",
                    "TokenUserID": currentToken,
                    "IdCard": ""
                }
            }
        });
        
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.AuthenUser).toBe("True");
    });

    for (const payload of injectionPayloads) {
        test(`should not allow SQL injection using payload: ${payload}`, async ({ request }) => {
            const response = await request.post(`${apiUrl}IsValidUser`, {
                data: {
                    param: {
                        ContextKey: "ReU",
                        ComputerLocationName: "com1",
                        user: payload,
                        password: "any",
                        RequireMenuAccessGroup: true
                    }
                }
            });
            
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.AuthenUser).not.toBe("True");
        });
    }
});
