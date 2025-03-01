# Ansible Codelab

## Set up 

```
python3 -m venv ./.venv
source ./.venv/bin/activate
pip install ansible
```

## Inventory file

```
[hosts]
ubuntu-01  ansible_user=root ansible_host={public-ip} private_ip={private-ip}
ubuntu-02  ansible_user=root ansible_host={public-ip} private_ip={private-ip}

[app]
ubuntu-01

[db]
ubuntu-02

[lb]
ubuntu-01
```

## Deploy all services

```
ansible-playbook -i inventory.ini ping_playbook.yaml
ansible-playbook -i inventory.ini setup_playbook.yaml
ansible-playbook -i inventory.ini run_db_playbook.yaml
ansible-playbook -i inventory.ini run_app_playbook.yaml
ansible-playbook -i inventory.ini run_proxy_playbook.yaml
```
