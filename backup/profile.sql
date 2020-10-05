--
-- PostgreSQL database dump
--

-- Dumped from database version 10.14 (Ubuntu 10.14-0ubuntu0.18.04.1)
-- Dumped by pg_dump version 10.14 (Ubuntu 10.14-0ubuntu0.18.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profile (
    username character varying NOT NULL,
    name character varying NOT NULL,
    "passwordHash" character varying NOT NULL,
    "accessLevel" public.profile_accesslevel_enum DEFAULT '3'::public.profile_accesslevel_enum NOT NULL,
    email character varying,
    subscribed boolean DEFAULT false NOT NULL,
    "eulaAccepted" boolean DEFAULT false NOT NULL,
    "eulaAcceptedOn" timestamp without time zone,
    "lastActivityOn" timestamp without time zone,
    "organizationId" character varying,
    "lastNoticeSeenOn" timestamp without time zone,
    "temporaryOrganizationName" character varying,
    "temporaryUser" boolean DEFAULT false NOT NULL,
    email_verified_at timestamp without time zone,
    email_verification_token character varying,
    email_verification_dt timestamp without time zone,
    password_reset_token character varying,
    password_reset_dt timestamp without time zone,
    lastname character varying,
    "hotKeyId" integer,
    "onboardingId" integer
);


ALTER TABLE public.profile OWNER TO postgres;

--
-- Data for Name: profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profile (username, name, "passwordHash", "accessLevel", email, subscribed, "eulaAccepted", "eulaAcceptedOn", "lastActivityOn", "organizationId", "lastNoticeSeenOn", "temporaryOrganizationName", "temporaryUser", email_verified_at, email_verification_token, email_verification_dt, password_reset_token, password_reset_dt, lastname, "hotKeyId", "onboardingId") FROM stdin;
ralph003	Ralph	$2b$10$6PgTV89iiwxeg4./3z0uPOPF1feTwrX.iK23lhSqQHJVuHGi9hOva	3		f	t	2020-06-23 15:24:17.491	2020-06-23 23:12:01.203	\N	2020-06-23 15:23:56.194	\N	f	\N	$2b$10$6s8YjAtoGgKSVX130m9AfuwsvenmDsYxwOiTsWEJn7szetdI4hxDy	2020-06-23 15:24:27.713	\N	\N	Test	\N	\N
test3	teads	$2b$10$Y.MYleEn0m.ieDc/3ONYXunywc.wwUJkNNolA94hJOXvALY0UspBG	3	wfsefgr@gmail.com	f	t	2020-08-21 13:35:23.241	2020-08-22 10:22:46.624	test	2020-08-21 13:35:12.672	\N	f	\N	$2b$10$LNFCt5hlk.IW/T0saPgoq.VrTh4bh4UTLUvPHhyRYij9ioaGPeYYG	2020-08-21 13:35:12.59	\N	\N	erfegfwefb	\N	\N
admin	Root User	$2b$10$V181rzv7c8OscKHg5GxOUuXIWFAG8aTxyXkhNw6vgChml.uZB1jOa	0	\N	t	t	2020-05-26 09:45:37.449	2020-10-05 05:35:31.017	test	2020-05-26 09:40:00.098	\N	f	\N	\N	\N	\N	\N	\N	1	\N
jonathan	Jonathan	$2b$10$Up.pFDozAgodhoy5qG355uVbyZPYA3O.dUGWntI3Skr/uBqYVrjy2	3	jonathanmousdell@gmail.com	f	t	2020-06-18 03:26:15.541	2020-06-19 01:11:21.441	\N	2020-06-18 03:26:06.638	\N	f	\N	$2b$10$L8yzGQDYxqgYV5e86xQmD.V8kvuaLprJdJNnA0sWW7atmxdjmnRca	2020-06-18 03:27:48.604	\N	2020-06-18 03:38:20.914	Mousdell	\N	\N
jmills	Jordan	$2b$10$9TXfxdqlNm46pZWQmkIr1OSbNhAZvxhb95GwqPohDCS3PHIrx24AS	3	j-mills@live.co.uk	f	t	2020-06-18 04:06:15.445	2020-06-20 01:02:52.038	\N	2020-06-18 04:05:57.938	\N	f	2020-06-18 04:12:43.844	\N	2020-06-18 04:09:08.778	\N	\N	Mills	\N	\N
test	test	$2b$10$9E7JOLiHJc2ik9ZkaPVnk.P2p3TF/rumcBrWKlkqQmX6JQn2mMpoq	3	test	f	t	2020-08-21 13:31:02.488	2020-08-21 13:31:10.438	\N	2020-07-07 09:05:55.89	\N	f	\N	$2b$10$ghYPzg3pmx8cj8C8ucIhTeXgeXL2YBXTmTgY4C5q2ytIVCpyXKzju	2020-07-07 09:05:55.802	\N	\N	test	\N	\N
rcuevas	Ralph	$2b$10$z3kP/lONywF3MgXSZ.x3aeUIA/HZQyZxVKx0D0RZTcovRttGc.E5C	3	rcuevas@fullscale.io	f	t	2020-09-17 09:21:43.083	2020-09-17 09:59:06.12	06106173587451361420	2020-09-17 09:21:33.808	\N	f	2020-09-17 09:22:00.817	\N	2020-09-17 09:21:33.725	\N	\N	FullScale	\N	\N
Andy	Andrew	$2b$10$nzBMgAcsqCPxUuBpOBswbOglj0k9LQjGX/3fLjDL/ob.lSxokbQxC	3	and.hudson@gmail.com	f	t	2020-06-18 03:59:33.566	2020-06-18 04:01:00.679	\N	2020-06-18 03:59:18.814	\N	f	2020-06-18 04:00:54.043	\N	2020-06-18 03:59:18.726	\N	\N	Hudson	\N	\N
ralphtest	ralphtest	$2b$10$pkbwenvTwM32XFySNJkOPuc9UyFwNotwnTuInqKm9hLtSOoMRFg8u	3	\N	f	f	\N	\N	\N	2020-06-11 05:05:47.934	\N	f	\N	\N	\N	\N	\N	\N	\N	\N
ralph002	Ralph	$2b$10$US8.24atfYDb/pHjqOXFM.Q2XJQeoomC2crky8KLw5b.S7Ur6PxGG	3	rcuevas@fullscale.io	f	t	2020-06-18 02:58:11.834	2020-06-18 03:04:49.038	\N	2020-06-18 02:57:38.902	\N	f	2020-06-18 02:58:20.574	\N	2020-06-18 02:57:38.814	\N	\N	Cuevas	\N	\N
test2	asfd	$2b$10$pnaEGz7veZldYQ5wtOCUteqgmZx8fzHZm6g2ZF8He7VaN4NorIqo6	3	wefwer@gmail.com	f	t	2020-08-21 13:32:00.366	2020-08-21 13:33:42.266	test	2020-08-21 13:31:52.382	\N	f	\N	$2b$10$AZE7dLKPp8t9cJrDosT3BOnZ5xZwzEYeAS9GdmiW9MX5GroymSeUu	2020-08-21 13:31:52.3	\N	\N	aewfwer	\N	\N
ralph001	Ralph	$2b$10$cxPYqPHnHS/9ooXYilgkUO8dY3tss8EW6/x7hdNIfFJ7oOcl5cDSm	3	rcuevas@fullscale.io	f	f	\N	\N	\N	2020-06-18 02:20:05.678	\N	f	\N	$2b$10$sgu4W26InrmsAxVFlwft2.oemU7yy2EAuXaa.BXaVMsNSQp/e3C2m	2020-06-18 02:20:05.59	\N	\N	Cuevas	\N	\N
ccscabang	christian	$2b$10$t/AlXtbyg57Dh81YKkN1jeP.gQ8Zmvdkt0tp0RDp4nfP6toRnhjou	3	ccscabang@gmail.com	f	t	2020-08-21 13:43:57.958	2020-08-21 13:46:25.181	47446969443629636944	2020-08-21 13:43:43.589	\N	f	\N	$2b$10$vilVvs1CyD.4jcp.HpZfuOywxw7hbOE4TRzYuXgxNAO6crjAxup2a	2020-08-21 13:43:43.506	\N	\N	cabang	\N	\N
maxwu	Max	$2b$10$BiJaYXORJW15MqdxHQjn7.YKoysUOUlb1fkrgC00FWUP0ZKrxeUGC	0	yujinwunz@gmail.com	f	t	2020-09-17 23:19:10.635	2020-09-17 23:20:25.563	test	2020-09-17 23:18:58.801	\N	f	\N	$2b$10$AK8N9erz2JHMmYy6UybtFOoD8sr4JWato0ZAteltCOMgT4Vs3EPHW	2020-09-17 23:18:58.718	\N	\N	Wu	\N	\N
test001	test	$2b$10$/QEHHYcWEcqFP37vm8k/NeH6G43ZUKG6IuhkBRMagQVTZWhgOJBb.	3	ralph.michael.cuevas@gmail.com	f	f	\N	2020-06-22 06:55:26.468	\N	2020-06-22 06:55:07.93	\N	f	\N	$2b$10$r7rvgeApcr8WIc.m5LGs.u3/tTvsa/FkTz6k1Yb/x9GMl9FW7c5ey	2020-06-22 06:55:07.842	\N	\N	test	\N	\N
h2xeng	H2X	$2b$10$Lhsuv8y3HpwiHt90SGQOS.2Oy95Ghu3eLCKTv1Ua5TVfipcox2iJi	3	jonathanmousdell@gmail.com	f	t	2020-08-22 00:53:04.163	2020-08-24 19:47:09.508	85175868645311923409	2020-08-22 00:52:55.43	\N	f	\N	$2b$10$6uP.Ppv/q7a7rJaCc9WkTuLmA4qZwP3XQt95WjaRB4ts3uPR7kvMG	2020-08-22 00:52:55.348	\N	\N	Engineering	\N	\N
\.


--
-- Name: profile PK_d80b94dc62f7467403009d88062; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile
    ADD CONSTRAINT "PK_d80b94dc62f7467403009d88062" PRIMARY KEY (username);


--
-- Name: profile UQ_ba8d034528aa3c44dc8ade931c6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile
    ADD CONSTRAINT "UQ_ba8d034528aa3c44dc8ade931c6" UNIQUE ("hotKeyId");


--
-- Name: profile UQ_bb8f8a616bd1273037f522ab837; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile
    ADD CONSTRAINT "UQ_bb8f8a616bd1273037f522ab837" UNIQUE ("onboardingId");


--
-- Name: profile FK_2aa279b4f271cc87abcf1de3514; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile
    ADD CONSTRAINT "FK_2aa279b4f271cc87abcf1de3514" FOREIGN KEY ("organizationId") REFERENCES public.organization(id);


--
-- Name: profile FK_ba8d034528aa3c44dc8ade931c6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile
    ADD CONSTRAINT "FK_ba8d034528aa3c44dc8ade931c6" FOREIGN KEY ("hotKeyId") REFERENCES public.hot_key(id);


--
-- Name: profile FK_bb8f8a616bd1273037f522ab837; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile
    ADD CONSTRAINT "FK_bb8f8a616bd1273037f522ab837" FOREIGN KEY ("onboardingId") REFERENCES public.onboarding(id);


--
-- PostgreSQL database dump complete
--

