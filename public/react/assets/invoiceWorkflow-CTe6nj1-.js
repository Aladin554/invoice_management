import{c as a}from"./createLucideIcon-CcvLQqOb.js";/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]],d=a("download",o),t=e=>(e||"").trim().toLowerCase(),r=e=>t(e.payment_method)==="cash",s=e=>!!(e.student_signed_at||e.customer_profile_submitted_at),_=e=>t(e.status)==="approved"||e.super_admin_approved_at?"approved":s(e)?r(e)&&!e.cash_manager_approved_at?"cash_review":"final_review":"not_signed";export{d as D,_ as g};
