pipeline {
    agent any

    environment {
        // Reemplaza con el ID de la credencial secreta creada en Jenkins
        SNYK_TOKEN          = credentials('snyk-token')
        PROJECT_REPO        = 'https://github.com/mpuertao/java-reachability-playground.git'
        SONAR_SCANNER_OPTS  = "-Xmx1024m"
    }

    tools {
        maven 'maven 3'
    }

    stages {
        stage('Checkout') {
            steps {
                git url: "${env.PROJECT_REPO}", branch: 'master'
            }
        }

        stage('Build') {
            steps {
                sh 'mvn clean compile'
            }
        }

        // stage('Analisis Estático - SonarCloud (Deuda Técnica)') {
        //     steps {
        //         withSonarQubeEnv('sonarcloud') {
        //             sh '''
        //                 mvn verify sonar:sonar -DskipTests \
        //                   -Dsonar.organization=mpuertao \
        //                   -Dsonar.projectKey=mpuertao_java-reachability-playground \
        //                   -Dsonar.sources=src \
        //                   -Dsonar.java.binaries=target/classes
        //             '''
        //         }
        //     }
        // }

        stage('version SNYK') {
            steps {
            
                    sh 'which snyk && snyk --version'
            }
        }

        stage('SCA - Software Composition Analysis') {
            steps {
                sh 'snyk test --all-projects'
            }
        }

        stage('SAST - Static Application Security Testing') {
            steps {
                sh 'snyk code test'
            }
        }

        stage('Package Artifact') {
            steps {
                sh 'mvn package -DskipTests'
                archiveArtifacts artifacts: 'target/*.jar', fingerprint: true
            }
        }

        stage('Promote to DEV') {
            steps {
                echo "HELLO WORLD from DEV environment"
            }
        }

        stage('Promote to QA') {
            steps {
                echo "HELLO WORLD from QA environment"
            }
        }

        stage('DAST - Dynamic Application Security Testing') {
            steps {
                // Simula un análisis DAST con Snyk (requiere app corriendo; aquí solo placeholder)
                echo 'Simulando DAST con Snyk (requiere app desplegada).'
                // En un entorno real podrías usar:
                // sh 'snyk iac test'
            }
        }

        stage('DAST - OWASP ZAP') {
            steps {
                script {
                    def targetURL = 'https://restful-booker.herokuapp.com/'  // Cambia por la URL real de tu app

                    echo "Iniciando análisis DAST con OWASP ZAP en ${targetURL}"

                    // Si usas Docker (recomendado):
                    sh """
                        docker run -t owasp/zap2docker-stable zap-baseline.py \
                            -t ${targetURL} \
                            -r zap_report.html \
                            -x zap_report.xml \
                            -J zap_report.json \
                            -m 10
                    """

                    // Archivar el reporte como resultado del análisis
                    archiveArtifacts artifacts: 'zap_report.*', fingerprint: true
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finalizado.'
        }
        failure {
            echo 'Hubo una falla en el pipeline. Revisa las etapas.'
        }
    }
}