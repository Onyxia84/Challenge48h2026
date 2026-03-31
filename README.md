# Projet Parkshare - Analyse de Données et Ciblage Spatial

Ce dépôt contient l'analyse de données réalisée dans le cadre du projet Parkshare. L'objectif de cette étude est d'exploiter les données ouvertes du Registre National des Copropriétés (RNC) afin d'identifier les zones géographiques et les résidences présentant un potentiel de places de stationnement sous-utilisées ou en tension.

## Indicateurs Clés de Performance (KPIs)

Afin d'orienter la stratégie de déploiement, notre analyse se décline en quatre axes majeurs, chacun documenté dans un Notebook Jupyter dédié :

* **KPI 1 : Score de potentiel par zone géographique (`Score_kpi1.ipynb`)**
    * *Objectif :* Identifier les villes et arrondissements présentant la plus forte concentration de logements situés dans notre zone de tension cible (ratio places/logements compris entre 0.5 et 0.9) pour orienter les actions de communication globales.
* **KPI 2 : Ciblage à l'échelle de l'immeuble (`Score_kpi2.ipynb`)**
    * *Objectif :* Isoler et classer les adresses exactes des copropriétés selon leur volume d'habitants et leur pertinence pour le modèle intra-résidence de Parkshare, facilitant ainsi la prospection terrain.
* **KPI 3 : Analyse volumétrique par département (`Score_kpi3.ipynb`)**
    * *Objectif :* Croiser le score de potentiel moyen avec le volume total de copropriétés cibles afin de déterminer les marchés départementaux les plus profonds.
* **KPI 4 : Classement des syndics de copropriété (`Syndic_kpi4.ipynb`)**
    * *Objectif :* Identifier les grands gestionnaires immobiliers administrant le plus grand nombre d'immeubles cibles, dans l'optique de proposer des partenariats de gestion à grande échelle.

## Environnement Technique

* **Extraction et structuration des données :** SQL (via DBeaver)
* **Nettoyage et analyse de données :** Python (bibliothèques Pandas, NumPy)
* **Environnement de développement :** Jupyter Notebook

## Instructions d'exécution locale

1. Clonez ce dépôt sur votre machine locale.
2. Installez les dépendances requises à l'aide de la commande suivante :
   ```bash
   pip install -r requirements.txt