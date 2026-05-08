import { test, expect } from '@playwright/test';
const data = require('../../cypress/fixtures/PAT_REGIS.json');
const { SearchInfo = [], HNInfo = {}, ListOfChronic = {}, VNInfo = {}, PatAllergy = { ListOfData: [] } } = data;
const { generateThaiID, generateRandomData } = require('../utils/data-utils');
import dotenv from 'dotenv';
dotenv.config();

const apiUrl = process.env.API_URL;

test.describe("Registration API", () => {
    let HN = '';
    let VN = '';

    test.describe("Searching", () => {
        for (const searchInfo of SearchInfo) {
            test(`${searchInfo.TestName}`, async ({ request }) => {
                const response = await request.post(`${apiUrl}EnquirePatientMaster`, {
                    data: {
                        "param": {
                            "IsFileDeletedFlag": true,
                            "EnglishView": false,
                            "GetPicture": false,
                            "OnlySchema": false,
                            "EnglishBill": false,
                            "GetVN": true,
                            "GetAddress": true,
                            "Amphoe": "",
                            "Tambon": "",
                            "Moo": "",
                            "Address": "",
                            "IDCardNo": data.IDCardNo,
                            "MemberID": "",
                            "Province": "",
                            "TelephoneNo": "",
                            "Gender": "",
                            "MaritalStatus": "",
                            "BirthDateTime": "",
                            "StringBirthDateTime": "",
                            "FileDeletedFlag": "2",
                            "MobilePhone": "",
                            "CompanyNo": "",
                            "PatientType": "",
                            "Nationality": "",
                            "ContextKey": "ReU",
                            "GetVisitDateParam": "",
                            "HN": data.HN,
                            "HNLike": "",
                            "FirstName": "",
                            "MiddleName": "",
                            "LastName": "",
                            "FirstNameLike": data.FirstNameLike,
                            "MiddleNameLike": "",
                            "LastNameLike": data.LastNameLike,
                            "Occupation": "",
                            "ListHN": [],
                            "LimitRecordNo": 0,
                            "LastVisitDateTimeFrom": "",
                            "LastVisitDateTimeTo": "",
                            "RequireLastUpdateDateTime": false,
                            "RequireChangeName": true,
                            "EntryByUserCode": "NIMDA",
                            "RequireCheckVisitorAllow": true
                        }
                    }
                });
                
                expect(response.status()).toBe(200);
                const body = await response.json();
                expect(body.ErrorMessage).toBe(searchInfo.ErrorMessage);
                expect(body.ListOfDetail).toEqual(searchInfo.ListOfDetail);
                expect(body.ResultStatusType).toBe(searchInfo.ResultStatusType);
                expect(body.ResultStatus).toBe(searchInfo.ResultStatus);
            });
        }

        test('Load button api check', async ({ request }) => {
            const response = await request.post(`${apiUrl}EnquireOPDHeader`, {
                data: {
                    "param": {
                        "RightNeedApproveCheckFlag": "",
                        "RightApprovedCheckFlag": "",
                        "RequireDocumentRegistration": false,
                        "EnglishView": false,
                        "RequireCouponPackageName": true,
                        "RequireFirstPrescript": false,
                        "GetPicture": false,
                        "GetPatientAge": false,
                        "GetAll": false,
                        "RequireEMail": false,
                        "OutDateTimeCheckFlag": "",
                        "InDateTimeCheckFlag": "",
                        "ApproveDateTimeCheckFlag": "",
                        "IDCard": "",
                        "LastName": "",
                        "FirstName": "",
                        "HNLike": "",
                        "HN": "",
                        "VisitDateTo": "2025-05-20T23:59:59",
                        "VisitDateFrom": "2025-05-20T00:00:00",
                        "VN": "",
                        "ContextKey": "ReU",
                        "Suffix": 0,
                        "ListOfComputerLocation": [],
                        "ListOfEntryByUserCode": [],
                        "ListOfDoctor": [],
                        "ListOfClinic": [],
                        "ListOfHN": [],
                        "Doctor": "",
                        "Clinic": ""
                    }
                }
            });
            
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.ResultStatus).toBe(true);
        });
    });

    test.describe('Submit Registration info', () => {
        const PatInfo = generateRandomData();
        const IDCard = generateThaiID();
        const PatGender = [
            { Gender: "1", Initial: "11", ThaiInitial: "น.ส." }, 
            { Gender: "2", Initial: "09", ThaiInitial: "นาย" }
        ];
        const GenderNum = Math.floor(Math.random() * PatGender.length);

        test('Submit Identity info', async ({ request }) => {
            const { HNInfo, ListOfChronic } = data;
            const response = await request.post(`${apiUrl}MobileUpdatePatientHeader`, {
                data: {
                    "param": {
                        ...HNInfo,
                        "ThaiNameFirstName": PatInfo.firstName,
                        "ThaiNameLastName": PatInfo.lastName,
                        "InitialNameCode": PatGender[GenderNum].Initial,
                        "Gender": PatGender[GenderNum].Gender,
                        "ListOfRef": [{
                            "Ref": IDCard
                        }],
                        "EnglishNameFirstName": PatInfo.nameTest,
                        "EnglishNameLastName": PatInfo.lastNTest,
                        "ListOfChronic": [{ ...ListOfChronic, "HN": HN }]
                    }
                }
            });
            
            expect(response.status()).toBe(200);
            const body = await response.json();
            HN = body.HN;
            expect(body.ErrorMessage).toBe('');
            expect(body.HN).not.toBe('');
            expect(body.ResultStatus).toBe(true);
        });

        test('Submit OPD for VN', async ({ request }) => {
            const response = await request.post(`${apiUrl}MobileUpdateOPDHeader`, {
                data: {
                    "param": { ...data.VNInfo, "HN": HN }
                }
            });
            
            expect(response.status()).toBe(200);
            const body = await response.json();
            VN = body.VN;
            expect(body.ErrorMessage).toBe('');
            expect(body.VN).not.toBe('');
            expect(body.ResultStatus).toBe(true);
        });

        test('EnquireHISBanner with previous data', async ({ request }) => {
            const response = await request.post(`${apiUrl}MobileEnquireHISBanner`, {
                data: {
                    "param": {
                        "RequireBedReserve": false,
                        "RequirePDPA": false,
                        "EnglishView": false,
                        "GetListAllergic": true,
                        "NotRequirePatientImage": false,
                        "RequireQRCodeHN": false,
                        "ContextKey": "ReU",
                        "HN": HN,
                        "PreHN": "",
                        "VisitDate": "2025-05-20T00:00:00",
                        "VN": VN,
                        "ViewType": ""
                    }
                }
            });
            
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.PatientName).toBe(`${PatGender[GenderNum].ThaiInitial} ${PatInfo.firstName} ${PatInfo.lastName}`);
            expect(body.HN).toBe(HN);
            expect(body.VN).toBe(VN);
            expect(body.ResultStatus).toBe(true);
        });

        test('Submit Pat Allergy', async ({ request }) => {
            const AllergyRequest = data.PatAllergy;
            const response = await request.post(`${apiUrl}MobileUpdatePatientAllergy`, {
                data: {
                    param: {
                        ...AllergyRequest,
                        HN: HN,
                        ListOfData: AllergyRequest.ListOfData.map(item => ({
                            ...item,
                            HN: HN
                        }))
                    }
                }
            });
            
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.ErrorMessage).toBe("");
            expect(body.ResultStatus).toBe(true);
        });
    });
});
