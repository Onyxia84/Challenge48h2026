SELECT
    numero_d_immatriculation AS id_copro,
    nom_d_usage_de_la_copropriete AS nom_copro,
    date_d_immatriculation,
    date_de_la_derniere_maj,

    type_de_syndic_benevole_professionnel_non_connu AS type_syndic,
    raison_sociale_du_representant_legal AS nom_syndic,

    numero_et_voie_adresse_de_reference AS numero_voie,
    adresse_de_reference AS adresse,
    code_postal_adresse_de_reference AS code_postal,
    commune_adresse_de_reference AS commune_adresse,

    lat,
    long,

    code_officiel_commune,
    nom_officiel_commune AS ville,
    code_officiel_arrondissement_commune,
    nom_officiel_arrondissement_commune AS arrondissement,
    code_officiel_departement AS dept_code,
    nom_officiel_departement AS dept_nom,
    nom_officiel_region AS region,

    nombre_total_de_lots AS total_lots,
    nombre_de_lots_a_usage_d_habitation AS lots_habitation,
    nombre_de_lots_de_stationnement AS lots_parking,
    nombre_total_de_lots_a_usage_d_habitation_de_bureaux_ou_de_comm AS lots_mixte,
    periode_de_construction AS periode_construction

FROM "rnc-data-gouv-with-qpv"

WHERE
    lat IS NOT NULL AND lat != ''
    AND long IS NOT NULL AND long != ''

    AND nombre_de_lots_de_stationnement IS NOT NULL
    AND nombre_de_lots_de_stationnement != ''
    AND nombre_de_lots_de_stationnement != '0'

    AND nombre_de_lots_a_usage_d_habitation IS NOT NULL
    AND nombre_de_lots_a_usage_d_habitation != ''
    AND nombre_de_lots_a_usage_d_habitation != '0';