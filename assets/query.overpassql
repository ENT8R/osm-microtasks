[out:json]
[timeout:3600];
area["ISO3166-2"="DE-NI"][admin_level=4]->.a;
(
 node(area.a)["phone"]["phone"!~"^[+][1-9]"];
 way(area.a)["phone"]["phone"!~"^[+][1-9]"];
 relation(area.a)["phone"]["phone"!~"^[+][1-9]"];

 node(area.a)["contact:phone"]["contact:phone"!~"^[+][1-9]"];
 way(area.a)["contact:phone"]["contact:phone"!~"^[+][1-9]"];
 relation(area.a)["contact:phone"]["contact:phone"!~"^[+][1-9]"];

 node(area.a)["fax"]["fax"!~"^[+][1-9]"];
 way(area.a)["fax"]["fax"!~"^[+][1-9]"];
 relation(area.a)["fax"]["fax"!~"^[+][1-9]"];

 node(area.a)["contact:fax"]["contact:fax"!~"^[+][1-9]"];
 way(area.a)["contact:fax"]["contact:fax"!~"^[+][1-9]"];
 relation(area.a)["contact:fax"]["contact:fax"!~"^[+][1-9]"];
);

out body geom qt;
